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

// Cloudinary transforma la imagen al vuelo según la URL, sin costo extra:
//   f_auto  elige el mejor formato para cada navegador (WebP/AVIF)
//   q_auto  baja la calidad hasta donde el ojo no lo nota
//   w_...   limita el ancho, que es lo que más pesa en fotos de celular
// Una foto de 4 MB suele quedar en ~150 KB sin diferencia visible.
export function imagenOptimizada(url: string, ancho = 800) {
  if (!esUrlDeCloudinary(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${ancho},c_limit/`);
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
