import { createHash, randomBytes } from "crypto";

// 24h en vez de 1h: el enlace suele abrirse desde el celular, a veces horas
// después de pedirlo. Sigue siendo de un solo uso, que es lo que acota el riesgo.
export const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

// SHA-256 sin sal: el token ya tiene 256 bits de entropía, no hace falta
// una KDF lenta y así la búsqueda por hash sigue siendo un lookup directo.
export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
