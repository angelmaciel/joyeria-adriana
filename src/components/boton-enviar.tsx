"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { PantallaCargando } from "@/components/pantalla-cargando";

/**
 * Botón de envío que muestra el diamante mientras corre la server action.
 *
 * Antes estos formularios no daban ninguna señal al enviarse: se apretaba
 * "Enviar" y no pasaba nada visible hasta que el servidor respondía. Con fotos
 * de varios MB eso son varios segundos en los que parece que no funcionó, y el
 * reflejo es volver a apretar.
 *
 * Por eso el botón además queda deshabilitado mientras dura el envío: el
 * overlay tapa el formulario, pero un segundo submit disparado con Enter antes
 * de que aparezca crearía la solicitud dos veces.
 *
 * useFormStatus lee el estado del <form> más cercano hacia arriba, así que este
 * componente tiene que estar dentro del form (no envolviéndolo).
 */
export function BotonEnviar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <Button type="submit" size="lg" disabled={pending} className={className}>
        {children}
      </Button>
      {pending && <PantallaCargando />}
    </>
  );
}
