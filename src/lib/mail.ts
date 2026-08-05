import nodemailer from "nodemailer";
import { BUSINESS_NAME } from "@/lib/constants";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  // Google muestra las contraseñas de aplicación en grupos de 4 separados por
  // espacios; copiarlas tal cual es un error habitual y el login falla.
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");

  // Sin SMTP configurado (dev): no se manda nada, el link se loguea en consola.
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
    // Muchos hosts (Render free entre ellos) bloquean el SMTP saliente: la
    // conexión no falla, se queda colgada. Sin estos timeouts el formulario
    // queda esperando para siempre y el usuario no ve ninguna respuesta.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transport = getTransport();

  if (!transport) {
    console.log("\n[dev] SMTP no configurado. Link de recuperación:");
    console.log(`[dev] ${to} -> ${resetUrl}\n`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: `Recuperar contraseña — ${BUSINESS_NAME}`,
    text: `Para crear una nueva contraseña entrá en este enlace (vence en 1 hora):\n\n${resetUrl}\n\nSi no pediste esto, ignorá el mensaje.`,
    html: `
      <p>Recibimos un pedido para restablecer la contraseña de tu cuenta de administración.</p>
      <p><a href="${resetUrl}">Crear una nueva contraseña</a></p>
      <p>El enlace vence en 1 hora. Si no pediste esto, ignorá el mensaje.</p>
    `,
  });
}
