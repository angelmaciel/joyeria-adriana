import { createHash } from "crypto";

// Se usa la API REST directamente en vez del SDK: son dos llamadas simples y
// evitamos otra dependencia (el proyecto ya arrastra un conflicto de peers).

export function cloudinaryConfigurado() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function firmar(params: Record<string, string>, apiSecret: string) {
  // Cloudinary firma los parámetros ordenados alfabéticamente, sin el api_key.
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(base + apiSecret).digest("hex");
}

export async function subirACloudinary(
  buffer: Buffer,
  folder: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const firmables = { folder, timestamp };

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]));
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", firmar(firmables, apiSecret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    throw new Error(`Cloudinary respondió ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

export function esUrlDeCloudinary(url: string) {
  return url.startsWith("https://res.cloudinary.com/");
}

// El public_id es la ruta después de /upload/v<version>/, sin la extensión.
function publicIdDesdeUrl(url: string) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match?.[1];
}

export async function borrarDeCloudinary(url: string) {
  const publicId = publicIdDesdeUrl(url);
  if (!publicId) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", firmar({ public_id: publicId, timestamp }, apiSecret));

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  }).catch(() => {});
}
