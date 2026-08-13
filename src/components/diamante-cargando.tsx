import { cn } from "@/lib/utils";

// Diamante dorado con un anillo girando alrededor, para las transiciones.
//
// Es SVG + animación CSS (no JS) a propósito: esto se muestra justo cuando el
// hilo principal está ocupado resolviendo la navegación, y una animación CSS
// corre fuera de ese hilo. Con requestAnimationFrame se trabaría en el peor
// momento, que es exactamente cuando se lo está mirando.
export function DiamanteCargando({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn("text-primary", className)}
    >
      <svg
        viewBox="0 0 64 64"
        className="size-20"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        {/* Anillo: un arco que gira. El dasharray está calculado sobre la
            circunferencia real (2·π·28 ≈ 176) para que el trazo sea un cuarto. */}
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="1.5"
          strokeOpacity="0.18"
        />
        <circle
          className="cargador-anillo"
          cx="32"
          cy="32"
          r="28"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="44 132"
        />

        {/* Gema: contorno de talla brillante — mesa arriba, cintura y pabellón
            en punta. Las líneas internas son las facetas. */}
        <g className="cargador-gema" strokeWidth="1.75" strokeLinejoin="round">
          <path d="M24 20 H40 L52 31 L32 52 L12 31 Z" />
          <path d="M12 31 H52" strokeOpacity="0.55" />
          <path d="M24 20 L19.5 31" strokeOpacity="0.55" />
          <path d="M40 20 L44.5 31" strokeOpacity="0.55" />
          <path d="M19.5 31 L32 52" strokeOpacity="0.4" />
          <path d="M44.5 31 L32 52" strokeOpacity="0.4" />
        </g>
      </svg>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
