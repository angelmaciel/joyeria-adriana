import Skeleton from "@mui/material/Skeleton";
import { PantallaCargando } from "@/components/pantalla-cargando";

// Next muestra esto mientras la ficha de producto resuelve su consulta.
//
// El esqueleto queda atrás y el overlay lo difumina con backdrop-blur, así que
// lo que se ve borroso es contenido real con la forma de la página que está por
// llegar — no un fondo inventado. Encima, solo el diamante.
//
// Todo arranca invisible y aparece a los 120ms: si la navegación se resuelve
// antes, no se ve ningún parpadeo de carga.
export default function CargandoProducto() {
  return (
    <div className="animate-fade-soft relative flex-1 [animation-delay:120ms]">
      <div aria-hidden className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <Skeleton variant="rectangular" className="aspect-square w-full rounded-xl" />
          <div className="flex flex-col gap-3">
            <Skeleton variant="rectangular" className="h-4 w-24 rounded-md" />
            <Skeleton variant="rectangular" className="h-8 w-3/4 rounded-md" />
            <Skeleton variant="rectangular" className="h-6 w-32 rounded-md" />
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton variant="rectangular" className="h-4 w-full rounded-md" />
              <Skeleton variant="rectangular" className="h-4 w-full rounded-md" />
              <Skeleton variant="rectangular" className="h-4 w-2/3 rounded-md" />
            </div>
            <Skeleton variant="rectangular" className="mt-4 h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <PantallaCargando />
    </div>
  );
}
