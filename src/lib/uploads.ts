import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const UPLOAD_DIR = path.join(UPLOADS_ROOT, "products");
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// La extensión y el MIME que manda el navegador son texto libre: se falsean trivialmente.
// Lo único confiable es el magic number (primeros bytes reales del archivo).
const SIGNATURES: { ext: string; matches: (b: Buffer) => boolean }[] = [
  {
    ext: ".jpg",
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: ".png",
    matches: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: ".webp",
    matches: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    ext: ".gif",
    matches: (b) => b.subarray(0, 3).toString("ascii") === "GIF",
  },
];

function detectImageExtension(buffer: Buffer) {
  return SIGNATURES.find((s) => s.matches(buffer))?.ext;
}

export async function saveUploadedImages(files: File[]): Promise<string[]> {
  const candidates = files.filter(
    (f) => f.size > 0 && f.size <= MAX_SIZE_BYTES
  );
  if (candidates.length === 0) return [];

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of candidates) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExtension(buffer);
    if (!ext) continue;

    const filename = `${crypto.randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/products/${filename}`);
  }
  return urls;
}

// Foto de referencia que manda el cliente (pieza a reparar, oro a vender, boceto).
// Vive aparte de las fotos de producto porque su ciclo de vida es distinto.
export async function saveRequestImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0 || file.size > MAX_SIZE_BYTES) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExtension(buffer);
  if (!ext) return null;

  const dir = path.join(UPLOADS_ROOT, "solicitudes");
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/solicitudes/${filename}`;
}

export async function deleteUploadedImage(url: string) {
  if (!url.startsWith("/uploads/products/")) return;
  // basename descarta cualquier "../" — la URL viene de la DB, pero el path
  // se construye acá y no debe poder escapar del directorio de uploads.
  const filename = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});
}
