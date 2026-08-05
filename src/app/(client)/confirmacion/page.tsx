import Link from "next/link";
import { CircleCheckBig, Home, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const MENSAJES: Record<string, string> = {
  servicio: "Hola! Acabo de enviar una solicitud de servicio desde la web.",
  oro: "Hola! Acabo de enviar una solicitud para vender oro desde la web.",
};

export default async function ConfirmacionPage({
  searchParams,
}: PageProps<"/confirmacion">) {
  const { tipo } = await searchParams;
  const mensaje =
    MENSAJES[typeof tipo === "string" ? tipo : ""] ??
    "Hola! Acabo de enviar una solicitud desde la web.";
  const waLink = buildWhatsAppLink(mensaje);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <CircleCheckBig className="size-10 text-primary" />
      <h1>¡Solicitud recibida!</h1>
      <p className="text-muted-foreground">
        Te vamos a contactar a la brevedad. Si querés, también podés escribirnos
        directamente por WhatsApp.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          nativeButton={false}
          className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
          render={<a href={waLink} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircle />
          Continuar por WhatsApp
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/inicio" />}>
          <Home />
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
