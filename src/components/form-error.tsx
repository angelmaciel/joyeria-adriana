import { MAX_UPLOAD_MB } from "@/lib/uploads";

const MENSAJES: Record<string, string> = {
  rate: "Enviaste varias solicitudes seguidas. Esperá unos minutos e intentá de nuevo.",
  too_large: `La foto pesa demasiado (máximo ${MAX_UPLOAD_MB} MB). Probá con una más liviana.`,
  not_image: "El archivo no es una imagen válida. Subí una foto (JPG, PNG o WEBP).",
};

export function FormError({ error }: { error?: string | string[] }) {
  if (!error) return null;
  const key = Array.isArray(error) ? error[0] : error;
  const mensaje = MENSAJES[key] ?? "Revisá los datos ingresados e intentá de nuevo.";

  return <p className="text-sm text-destructive">{mensaje}</p>;
}
