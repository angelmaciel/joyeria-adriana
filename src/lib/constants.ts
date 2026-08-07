// Nombre visible del negocio. Está acá para no tenerlo repetido en el header,
// la portada, el <title> y los emails.
export const BUSINESS_NAME = "Joyería y Relojería Adriana";

// La fabricación a medida tiene su propia tarjeta en el inicio y su propio
// formulario, así que no se lista junto a los servicios de reparar/limpiar.
export const CUSTOM_ORDER_SLUG = "fabricacion-a-medida";

export const REQUEST_STATUSES = [
  "PENDIENTE",
  "COTIZADO",
  "EN_PROCESO",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDIENTE: "Pendiente",
  COTIZADO: "Cotizado",
  EN_PROCESO: "En proceso",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
