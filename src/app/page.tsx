import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotonEnviar } from "@/components/boton-enviar";
import { enterClientMode } from "@/lib/actions";
import { BUSINESS_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1>{BUSINESS_NAME}</h1>
        <p className="text-muted-foreground">¿Cómo querés ingresar?</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-4">
        {/* "Soy cliente" corre una server action, así que la espera la cubre
            BotonEnviar. "Administrador" es una navegación: esa la cubre el
            loading.tsx de la raíz. */}
        <form action={enterClientMode}>
          <BotonEnviar className="w-full">
            <ShoppingBag />
            Soy cliente
          </BotonEnviar>
        </form>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/login" />}
        >
          <ShieldCheck />
          Administrador
        </Button>
      </div>
    </div>
  );
}
