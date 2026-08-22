// URL pública del sitio, sin barra final.
//
// En Vercel el dominio recién se conoce después del primer despliegue, así que
// mientras SITE_URL no esté cargada se deduce del entorno:
//   - VERCEL_PROJECT_PRODUCTION_URL es el dominio estable del proyecto y es el
//     que queremos en los links que salen por WhatsApp o por email, incluso si
//     el código corre en una preview.
//   - VERCEL_URL es el de ese despliegue puntual; sirve de última red.
// Las dos vienen sin protocolo.
//
// SITE_URL sigue teniendo prioridad: es la única forma de apuntar a un dominio
// propio, y en producción debería estar cargada.
export function siteUrl() {
  const explicita = process.env.SITE_URL?.trim();
  if (explicita) return explicita.replace(/\/+$/, "");

  const enVercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (enVercel) return `https://${enVercel}`;

  return "http://localhost:3000";
}
