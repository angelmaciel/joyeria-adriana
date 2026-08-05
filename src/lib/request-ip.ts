import { headers } from "next/headers";

export async function getClientIp() {
  const h = await headers();
  // Vercel/proxies: el primero de x-forwarded-for es el cliente real.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
