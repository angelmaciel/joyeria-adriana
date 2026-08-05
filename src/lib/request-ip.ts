import { headers } from "next/headers";

export async function getClientIp() {
  const h = await headers();

  // El cliente puede mandar su propio x-forwarded-for; el proxy le AGREGA la IP
  // real que vio, así que queda "falsa, ..., real". Tomar la primera sería
  // confiar en el atacante y permitiría saltarse el rate limit cambiando el
  // header. La última entrada es la que puso nuestro proxy.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return h.get("x-real-ip") ?? "unknown";
}
