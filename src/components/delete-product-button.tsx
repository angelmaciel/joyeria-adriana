"use client";

import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        // Es irreversible y borra también las fotos: conviene pedir confirmación.
        const ok = window.confirm(
          `¿Eliminar "${name}" definitivamente?\n\nSe borra el producto y sus fotos. Esta acción no se puede deshacer.\n\nSi solo querés sacarlo del catálogo por un tiempo, usá "Desactivar".`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        aria-label={`Eliminar ${name}`}
      >
        <Trash2 />
        Eliminar
      </Button>
    </form>
  );
}
