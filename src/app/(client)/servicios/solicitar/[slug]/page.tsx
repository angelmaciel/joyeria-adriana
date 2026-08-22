import { notFound } from "next/navigation";
import { User, Phone, Camera, MessageSquareText, MessageCircle } from "lucide-react";
import {
  FormError,
  esErrorDeFoto,
  ID_ERROR_FORMULARIO,
} from "@/components/form-error";
import { MAX_UPLOAD_MB } from "@/lib/uploads";
import { prisma } from "@/lib/prisma";
import { createServiceRequest } from "@/lib/actions";
import { BotonEnviar } from "@/components/boton-enviar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function SolicitarServicioPage({
  params,
  searchParams,
}: PageProps<"/servicios/solicitar/[slug]">) {
  const { slug } = await params;
  const { error } = await searchParams;
  const fotoRechazada = esErrorDeFoto(error);

  const serviceType = await prisma.serviceType.findFirst({
    where: { slug, isActive: true },
  });
  if (!serviceType) notFound();

  return (
    <div className="animate-fade-up mx-auto w-full max-w-md px-4 py-8">
      <h1 className="text-center">{serviceType.name}</h1>
      <p className="mt-1 text-center text-muted-foreground">{serviceType.description}</p>

      <form
        action={createServiceRequest}
        className="mt-6 flex flex-col gap-4"
      >
        <input type="hidden" name="serviceTypeId" value={serviceType.id} />
        <input type="hidden" name="serviceTypeSlug" value={serviceType.slug} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clientName">
            <User className="size-5 text-primary" />
            Nombre
          </Label>
          <Input
            id="clientName"
            name="clientName"
            autoComplete="name"
            required
            minLength={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clientPhone">
            <Phone className="size-5 text-primary" />
            Teléfono
          </Label>
          <Input
            id="clientPhone"
            name="clientPhone"
            type="tel"
            autoComplete="tel"
            required
            minLength={6}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">
            <MessageSquareText className="size-5 text-primary" />
            Contanos qué necesitás
          </Label>
          <Textarea id="description" name="description" required minLength={10} rows={4} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="referenceImage">
            <Camera className="size-5 text-primary" />
            Foto de referencia (opcional)
          </Label>
          <input
            id="referenceImage"
            name="referenceImage"
            type="file"
            accept="image/*"
            aria-invalid={fotoRechazada || undefined}
            aria-describedby={
              fotoRechazada
                ? `ayuda-foto ${ID_ERROR_FORMULARIO}`
                : "ayuda-foto"
            }
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <p id="ayuda-foto" className="text-xs text-muted-foreground">
            Sacale una foto a la pieza o subí tu boceto — se envía junto con el mensaje (hasta {MAX_UPLOAD_MB} MB).
          </p>
        </div>
        <FormError error={error} />
        <BotonEnviar className="mt-2 bg-[#25D366] text-white hover:bg-[#1ebe57]">
          <MessageCircle />
          Enviar por WhatsApp
        </BotonEnviar>
      </form>
    </div>
  );
}
