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
