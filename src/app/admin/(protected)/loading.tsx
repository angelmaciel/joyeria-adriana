import { PantallaCargando } from "@/components/pantalla-cargando";

// Cubre el panel: dashboard, productos, solicitudes y compra de oro. Estas
// pantallas consultan la base en cada carga, así que la espera es real.
export default function CargandoPanel() {
  return <PantallaCargando />;
}
