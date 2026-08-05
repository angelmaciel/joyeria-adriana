import nodemailer from "nodemailer";
import { BUSINESS_NAME } from "@/lib/constants";

const ASUNTO = `Recuperar contraseña — ${BUSINESS_NAME}`;

function cuerpoTexto(resetUrl: string) {
  return `Para crear una nueva contraseña entrá en este enlace (vence en 24 horas):\n\n${resetUrl}\n\nSi no pediste esto, ignorá el mensaje.`;
}

function cuerpoHtml(resetUrl: string) {
  return `
      <p>Recibimos un pedido para restablecer la contraseña de tu cuenta de administración.</p>
      <p><a href="${resetUrl}">Crear una nueva contraseña</a></p>
      <p>El enlace vence en 24 horas. Si no pediste esto, ignorá el mensaje.</p>
    `;
}

// Resend va por HTTPS, así que funciona donde el SMTP está bloqueado —que es el
// caso de Render en plan gratuito: la conexión al puerto 587 no falla, se cuelga
// hasta el timeout y el correo nunca sale.
async function enviarConResend(to: string, resetUrl: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      to,
      subject: ASUNTO,
      text: cuerpoTexto(resetUrl),
      html: cuerpoHtml(resetUrl),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

function transporteSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  // Google muestra las contraseñas de aplicación en grupos de 4 separados por
  // espacios; copiarlas tal cual es un error habitual y el login falla.
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
    // Sin estos timeouts, un puerto bloqueado deja el formulario esperando
    // indefinidamente en vez de fallar rápido.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (process.env.RESEND_API_KEY) {
    await enviarConResend(to, resetUrl);
    return;
  }

  const transport = transporteSmtp();
  if (!transport) {
    console.log("\n[dev] Sin proveedor de correo. Link de recuperación:");
    console.log(`[dev] ${to} -> ${resetUrl}\n`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: ASUNTO,
    text: cuerpoTexto(resetUrl),
    html: cuerpoHtml(resetUrl),
  });
}
