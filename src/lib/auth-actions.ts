"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { siteUrl } from "@/lib/site-url";

const BCRYPT_ROUNDS = 12;

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden.",
  });

const FIFTEEN_MIN = 15 * 60 * 1000;

export type EstadoLogin = { error: string } | null;

/**
 * Ingreso al panel.
 *
 * Devuelve el error en vez de redirigir a `?error=1` como antes. La redirección
 * era una navegación completa: la página se volvía a renderizar de cero y la
 * persona perdía el email que acababa de escribir, teniendo que tipearlo otra
 * vez para corregir solo la contraseña.
 *
 * El límite de intentos vive en el provider de credenciales (`src/auth.ts`), no
 * acá, así que sigue aplicándose igual.
 */
export async function iniciarSesion(
  _anterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // TooManyAttempts extiende CredentialsSignin, así que sin mirar el código
      // el bloqueo por intentos se confundía con una contraseña equivocada y la
      // persona se quedaba dudando de su propia contraseña.
      if ((error as { code?: string }).code === "too_many_attempts") {
        return {
          error:
            "Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.",
        };
      }
      return { error: "Email o contraseña incorrectos." };
    }
    // El éxito de signIn también llega acá, como NEXT_REDIRECT: hay que dejarlo pasar.
    throw error;
  }

  return null;
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = await getClientIp();

  // Límites deliberadamente altos: no están para molestar a quien reintenta
  // —eso ya causó problemas reales— sino solo para que nadie pueda usar este
  // formulario como herramienta para inundar de correos una casilla ajena.
  // Una persona normal nunca los va a alcanzar.
  const perEmail = checkRateLimit(`reset-email:${email}`, 30, FIFTEEN_MIN);
  const perIp = checkRateLimit(`reset-ip:${ip}`, 60, FIFTEEN_MIN);
  if (!perEmail.allowed || !perIp.allowed) {
    // Se informa la espera concreta: "esperá unos minutos" deja a la persona
    // reintentando a ciegas.
    const seg = Math.max(perEmail.retryAfterSeconds, perIp.retryAfterSeconds);
    redirect(`/admin/recuperar?error=rate&min=${Math.ceil(seg / 60)}`);
  }

  const user = email
    ? await prisma.adminUser.findUnique({ where: { email } })
    : null;

  if (user) {
    // Antes cada pedido anulaba el anterior. En la práctica eso rompía el caso
    // más común: la persona no ve el correo, vuelve a pedirlo, y al abrir
    // cualquiera de los mensajes de su bandeja se encuentra con "enlace
    // vencido" sin entender por qué. Ahora conviven: igual son de un solo uso y
    // son de un solo uso, que es lo que acota el riesgo.
    // Solo se limpian los que ya no sirven, para no acumular basura.
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    const { token, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // El envío no debe tumbar la acción: si el correo falla, el token ya quedó
    // creado y el enlace aparece en los logs del servidor, así que la admin
    // igual puede recuperar la cuenta. Devolver siempre la misma respuesta
    // evita además revelar si el email existe.
    try {
      await sendPasswordResetEmail(
        user.email,
        `${siteUrl()}/admin/recuperar/${token}`
      );
    } catch (error) {
      console.error(
        "[reset] No se pudo enviar el email:",
        (error as Error).message
      );
      console.error(
        `[reset] Enlace para ${user.email}: ${siteUrl()}/admin/recuperar/${token}`
      );
    }
  }

  // Siempre el mismo resultado exista o no la cuenta: no revelar qué emails están registrados.
  redirect("/admin/recuperar?enviado=1");
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  // El token tiene 256 bits, así que adivinarlo es inviable; el límite es para
  // que nadie pueda martillar este endpoint gratis.
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`reset-submit:${ip}`, 60, FIFTEEN_MIN);
  if (!allowed) redirect(`/admin/recuperar/${token}?error=rate`);

  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) redirect(`/admin/recuperar/${token}?error=1`);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    redirect(`/admin/recuperar/${token}?error=invalid`);
  }

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: record.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS),
        // Invalida las sesiones abiertas: si la cuenta estaba comprometida,
        // cambiar la contraseña tiene que echar al intruso.
        passwordChangedAt: new Date(),
      },
    }),
    // Se anulan TODOS los enlaces pendientes de esa cuenta, no solo el usado:
    // ahora pueden coexistir varios y uno viejo no debe servir para volver a
    // cambiar la contraseña después.
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/admin/login?ok=password_actualizada");
}
