"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MENSAJES: Record<string, string> = {
  producto_creado: "Producto creado correctamente.",
  producto_actualizado: "Cambios guardados.",
  producto_activado: "El producto volvió a estar visible en el catálogo.",
  producto_desactivado: "El producto ya no se muestra en el catálogo.",
  producto_eliminado: "Producto eliminado.",
  solicitud_actualizada: "Solicitud actualizada.",
  password_actualizada: "Contraseña actualizada. Ya podés ingresar.",
};

export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const yaMostrado = useRef<string | null>(null);

  const ok = params.get("ok");

  useEffect(() => {
    if (!ok || yaMostrado.current === ok) return;
    yaMostrado.current = ok;

    toast.success(MENSAJES[ok] ?? "Listo.");

    // Se saca el parámetro de la URL: si no, el aviso reaparecería al recargar
    // o al volver con el botón de atrás.
    router.replace(pathname);
  }, [ok, pathname, router]);

  return null;
}
