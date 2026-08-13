import { Skeleton } from "@/components/ui/skeleton";
import { PantallaCargando } from "@/components/pantalla-cargando";

// Mismo criterio que en la ficha de producto: esqueleto atrás, difuminado por
// el overlay, y solo el diamante al frente. Espera 120ms antes de aparecer para
// que una carga rápida no muestre un parpadeo.
export default function CargandoCatalogo() {
  return (
    <div className="animate-fade-soft relative flex-1 [animation-delay:120ms]">
      <div aria-hidden className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-center">Catálogo</h1>
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded-4xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <PantallaCargando />
    </div>
  );
}
