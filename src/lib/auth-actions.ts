"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { siteUrl } from "@/lib/whatsapp";

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

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = await getClientIp();

  // Dos límites con propósitos distintos: por email para que nadie inunde de
  // correos una cuenta concreta, y por IP —más holgado— contra alguien que
  // pruebe muchas cuentas. Si el límite fuera solo por IP, un usuario que se
  // equivoca un par de veces dejaría bloqueados a los demás.
  // 5 alcanza para quien no vio el correo y reintenta un par de veces; con 3 se
  // bloqueaba a gente legítima.
  const perEmail = checkRateLimit(`reset-email:${email}`, 5, FIFTEEN_MIN);
  const perIp = checkRateLimit(`reset-ip:${ip}`, 20, FIFTEEN_MIN);
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
    // duran 1 hora, así que la ventana de exposición no cambia.
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
  const { allowed } = checkRateLimit(`reset-submit:${ip}`, 10, FIFTEEN_MIN);
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
