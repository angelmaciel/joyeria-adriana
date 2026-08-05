import { z } from "zod";
import { REQUEST_STATUSES } from "@/lib/constants";

// El campo puede llegar vacío (form del navegador) o ausente/null (llamada directa
// a la acción): ambos casos deben tratarse como "sin valor", no como error.
const emptyToUndefined = (val: unknown) =>
  val == null || (typeof val === "string" && val.trim() === "") ? undefined : val;

export const serviceRequestSchema = z.object({
  serviceTypeId: z.string().min(1),
  clientName: z.string().trim().min(2, "Ingresá tu nombre completo."),
  clientPhone: z.string().trim().min(6, "Ingresá un teléfono válido."),
  description: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres)."),
});

export const goldPurchaseRequestSchema = z.object({
  clientName: z.string().trim().min(2, "Ingresá tu nombre completo."),
  clientPhone: z.string().trim().min(6, "Ingresá un teléfono válido."),
  description: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres)."),
});

export const requestUpdateSchema = z.object({
  status: z.enum(REQUEST_STATUSES),
  adminNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  price: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
});

export const productFieldsSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto."),
  description: z.string().trim().min(5, "La descripción es muy corta."),
  categoryId: z.string().min(1, "Elegí una categoría."),
  price: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  priceVisible: z.preprocess((val) => val === "on", z.boolean()),
});
