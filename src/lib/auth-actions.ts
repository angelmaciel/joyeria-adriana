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

export async function requestPasswordReset(formData: FormData) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`reset:${ip}`, 3, 15 * 60 * 1000);
  if (!allowed) redirect("/admin/recuperar?error=rate");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = email
    ? await prisma.adminUser.findUnique({ where: { email } })
    : null;

  if (user) {
    // Un solo token válido a la vez: los pedidos anteriores quedan inutilizables.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const { token, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    await sendPasswordResetEmail(
      user.email,
      `${siteUrl()}/admin/recuperar/${token}`
    );
  }

  // Siempre el mismo resultado exista o no la cuenta: no revelar qué emails están registrados.
  redirect("/admin/recuperar?enviado=1");
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
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
      data: { passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/admin/login?reset=1");
}
