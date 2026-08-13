import Link from "next/link";
import { ShoppingBag, Wrench, Coins, Hammer } from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { CUSTOM_ORDER_SLUG } from "@/lib/constants";

const ACCIONES = [
  {
    href: "/catalogo",
    title: "Comprar",
    description: "Mirá el catálogo y consultanos por WhatsApp.",
    icon: ShoppingBag,
  },
  {
    href: "/servicios",
    title: "Reparar o limpiar",
    description: "Pedí presupuesto para una reparación o limpieza.",
    icon: Wrench,
  },
  {
    href: "/vender-oro",
    title: "Vender oro",
    description: "Contanos qué querés vender y te ofrecemos un precio.",
    icon: Coins,
  },
  {
    href: `/servicios/solicitar/${CUSTOM_ORDER_SLUG}`,
    title: "Fabricar a medida",
    description: "Diseñamos y fabricamos una pieza única para vos.",
    icon: Hammer,
  },
] as const;

export default function InicioPage() {
  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-center">¿Qué necesitás?</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ACCIONES.map((accion) => (
          <Link key={accion.href} href={accion.href}>
            <Card className="tarjeta-interactiva h-full">
              <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                <accion.icon className="size-10 text-primary" />
                <CardTitle className="text-base">{accion.title}</CardTitle>
                <CardDescription>{accion.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-muted-foreground mt-8 text-center text-sm">
        ¿Querés conocernos?{" "}
        <Link
          href="/sobre-nosotros"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Sobre nosotros
        </Link>
      </p>
    </div>
  );
}
