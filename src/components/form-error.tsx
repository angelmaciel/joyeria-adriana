import { MAX_UPLOAD_MB } from "@/lib/uploads";

// Fijo y exportado para que el campo que causó el error pueda apuntarle con
// aria-describedby sin repetir el string en cada formulario.
export const ID_ERROR_FORMULARIO = "error-formulario";

const MENSAJES: Record<string, string> = {
  rate: "Enviaste varias solicitudes seguidas. Esperá unos minutos e intentá de nuevo.",
  too_large: `La foto pesa demasiado (máximo ${MAX_UPLOAD_MB} MB). Probá con una más liviana.`,
  not_image: "El archivo no es una imagen válida. Subí una foto (JPG, PNG o WEBP).",
};

// Los únicos errores que son de un campo concreto —la foto— y no del formulario
// entero. Con esto el input se marca inválido y queda conectado al mensaje, en
// vez de dejar al usuario buscando cuál de los cuatro campos falló.
const ERRORES_DE_FOTO = new Set(["too_large", "not_image"]);

function clave(error?: string | string[]) {
  return Array.isArray(error) ? error[0] : error;
}

export function esErrorDeFoto(error?: string | string[]) {
  const k = clave(error);
  return k !== undefined && ERRORES_DE_FOTO.has(k);
}

export function FormError({ error }: { error?: string | string[] }) {
  if (!error) return null;
  const k = clave(error);
  const mensaje =
    (k && MENSAJES[k]) ?? "Revisá los datos ingresados e intentá de nuevo.";

  // role="alert" para que el lector de pantalla lo anuncie al aparecer. Sin esto
  // el mensaje era solo visual: quien no ve la pantalla apretaba "Enviar por
  // WhatsApp", volvía la misma página y no había forma de saber que la foto
  // había sido rechazada. El login ya lo hacía bien; los formularios públicos no.
  return (
    <p
      id={ID_ERROR_FORMULARIO}
      role="alert"
      className="text-sm text-destructive"
    >
      {mensaje}
    </p>
  );
}
