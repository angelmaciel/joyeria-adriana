import { TriangleAlert } from "lucide-react";
import { esIlegible } from "@/lib/crypto";

/**
 * Muestra un valor que viene de un campo cifrado.
 *
 * Si no se pudo descifrar lo marca visualmente en vez de dejarlo pasar como si
 * fuera el dato real: antes, un fallo de descifrado terminaba mostrando el
 * texto cifrado en el lugar del nombre del cliente.
 */
export function ValorCifrado({ children }: { children: string }) {
  if (!esIlegible(children)) return <>{children}</>;
  return <span className="text-destructive italic">{children}</span>;
}

/**
 * Explica por qué hay datos ilegibles. Va una sola vez por pantalla, arriba de
 * los datos, para que el operador no tenga que adivinar qué pasó.
 */
export function AvisoIlegible() {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        Algunos datos no se pudieron descifrar. Pasa cuando la clave de cifrado
        (<code className="font-mono text-xs">ENCRYPTION_KEY</code>) se cambió
        después de que se guardaron: lo anterior queda ilegible y no se puede
        recuperar sin la clave original.
      </p>
    </div>
  );
}
