import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enterClientMode } from "@/lib/actions";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1>Joyería Adriana</h1>
        <p className="text-muted-foreground">¿Cómo querés ingresar?</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <form action={enterClientMode}>
          <Button type="submit" size="lg" className="w-full">
            <ShoppingBag />
            Soy cliente
          </Button>
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
