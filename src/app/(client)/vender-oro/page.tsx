import { User, Phone, Camera, MessageSquareText, MessageCircle } from "lucide-react";
import { FormError } from "@/components/form-error";
import { createGoldPurchaseRequest } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function VenderOroPage({
  searchParams,
}: PageProps<"/vender-oro">) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="text-center">Vender oro</h1>
      <p className="mt-1 text-center text-muted-foreground">
        Contanos qué querés vender y te contactamos con una oferta.
      </p>

      <form
        action={createGoldPurchaseRequest}
        className="mt-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clientName">
            <User className="size-5 text-primary" />
            Nombre
          </Label>
          <Input id="clientName" name="clientName" required minLength={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clientPhone">
            <Phone className="size-5 text-primary" />
            Teléfono
          </Label>
          <Input id="clientPhone" name="clientPhone" required minLength={6} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">
            <MessageSquareText className="size-5 text-primary" />
            Descripción (peso aproximado, tipo de pieza, etc.)
          </Label>
          <Textarea id="description" name="description" required minLength={10} rows={4} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="referenceImage">
            <Camera className="size-5 text-primary" />
            Foto del oro (opcional)
          </Label>
          <input
            id="referenceImage"
            name="referenceImage"
            type="file"
            accept="image/*"
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <p className="text-xs text-muted-foreground">
            Sacale una foto a la pieza — se envía junto con el mensaje (hasta 8 MB).
          </p>
        </div>
        <FormError error={error} />
        <Button
          type="submit"
          size="lg"
          className="mt-2 bg-[#25D366] text-white hover:bg-[#1ebe57]"
        >
          <MessageCircle />
          Enviar por WhatsApp
        </Button>
      </form>
    </div>
  );
}
