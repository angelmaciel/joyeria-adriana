import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Los precios llegan como Decimal de Prisma (dinero no se guarda como Float).
// El guaraní no usa centavos, así que se muestra sin decimales.
export function formatGuaranies(value: { toString(): string }) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value.toString()));
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
