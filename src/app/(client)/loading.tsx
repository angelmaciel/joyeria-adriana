import { PantallaCargando } from "@/components/pantalla-cargando";

// Cubre toda la parte pública que no tenga su propio loading.tsx: inicio,
// servicios, el formulario de cada servicio, vender oro, sobre nosotros y
// confirmación. Catálogo y ficha de producto tienen el suyo, con esqueleto.
export default function CargandoCliente() {
  return <PantallaCargando />;
}
