import Link from "next/link";
import { ShoppingBag, Wrench, Coins, Hammer } from "lucide-react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
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
          <Card key={accion.href} className="tarjeta-interactiva h-full">
            {/* El área clickeable es la tarjeta entera, no solo el título.
                Con href, CardActionArea la vuelve un <a> real (el LinkComponent
                sale del theme) y le da foco visible; antes iba envuelta en un
                <Link> pelado y con teclado no se veía nada. */}
            <CardActionArea href={accion.href}>
              <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                <accion.icon className="size-10 text-primary" />
                <Typography variant="subtitle1" component="h2">
                  {accion.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {accion.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
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
