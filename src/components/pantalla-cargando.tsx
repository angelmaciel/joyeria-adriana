import { cn } from "@/lib/utils";
import { DiamanteCargando } from "@/components/diamante-cargando";

/**
 * Overlay de transición: difumina lo que haya detrás y deja solo el diamante.
 *
 * Se usa en dos situaciones distintas con el mismo aspecto, a propósito, para
 * que navegar y enviar un formulario se sientan igual:
 *  - en los `loading.tsx`, mientras Next resuelve una navegación;
 *  - dentro de un form, mientras corre la server action (ver BotonEnviar).
 *
 * Por defecto va `fixed`, para que el diamante quede centrado en el viewport
 * aunque el contenido de atrás sea más alto que la pantalla.
 *
 * Con `dentroDelContenedor` se acota al padre posicionado más cercano. Es para
 * cuando solo una parte de la página está recargando y el resto tiene que
 * seguir usable — filtrar el catálogo, por ejemplo: taparle los filtros al
 * usuario justo después de que tocó uno no tiene sentido.
 *
 * Arranca invisible y aparece recién a los 120ms: si la acción se resuelve
 * antes, no se ve un parpadeo de carga, que es peor que no mostrar nada.
 */
export function PantallaCargando({
  className,
  dentroDelContenedor = false,
}: {
  className?: string;
  dentroDelContenedor?: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-fade-soft bg-background/40 z-50 flex items-center justify-center backdrop-blur-md [animation-delay:120ms]",
        dentroDelContenedor ? "absolute inset-0" : "fixed inset-0",
        className,
      )}
    >
      <DiamanteCargando />
    </div>
  );
}
