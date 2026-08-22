"use client";

import Link from "next/link";
import Chip from "@mui/material/Chip";

/**
 * Filtro de categoría del catálogo.
 *
 * Es un componente cliente por una sola razón: `Chip` tiene un `div` por raíz,
 * así que no acepta `href` y el LinkComponent del theme —que solo entra cuando
 * la raíz sería un `button`, como en CardActionArea— no aplica. La única forma
 * de que el chip sea él mismo el enlace es `component={Link}`, y eso desde un
 * server component rompe el renderizado en servidor de la ruta entera (ver
 * CLAUDE.md). Acá no cruza ningún límite.
 *
 * `component="a"` a secas no sirve: sería un ancla común y la navegación
 * dejaría de ser del lado del cliente, que es de lo que depende que el Suspense
 * de la grilla vuelva a mostrar su esqueleto al cambiar de filtro.
 */
export function ChipCategoria({
  label,
  href,
  activo,
}: {
  label: string;
  href: string;
  activo: boolean;
}) {
  return (
    <Chip
      component={Link}
      href={href}
      label={label}
      clickable
      size="small"
      color={activo ? "primary" : "default"}
      variant={activo ? "filled" : "outlined"}
      aria-current={activo ? "page" : undefined}
    />
  );
}
