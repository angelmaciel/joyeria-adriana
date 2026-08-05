import { cookies } from "next/headers";

export const CLIENT_MODE_COOKIE = "client_mode";

export async function isClientMode() {
  const store = await cookies();
  return store.get(CLIENT_MODE_COOKIE)?.value === "1";
}
