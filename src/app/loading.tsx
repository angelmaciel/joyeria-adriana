import { PantallaCargando } from "@/components/pantalla-cargando";

// Red de contención: cubre toda navegación que no caiga bajo un loading.tsx más
// específico — la portada, el ingreso al panel y el reseteo de contraseña.
export default function Cargando() {
  return <PantallaCargando />;
}
