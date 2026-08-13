import { notFound } from "next/navigation";
import { ReferencePhoto } from "@/components/reference-photo";
import { ClipboardList, DollarSign, NotebookPen, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { decrypt, decryptOptional, esIlegible } from "@/lib/crypto";
import { AvisoIlegible, ValorCifrado } from "@/components/dato-cifrado";
import { updateServiceRequest } from "@/lib/actions";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminSolicitudDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/solicitudes/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { serviceType: true },
  });
  if (!request) notFound();

  const nombre = decrypt(request.clientName);
  const telefono = decrypt(request.clientPhone);
  const descripcion = decrypt(request.description);
  const notas = decryptOptional(request.adminNotes);
  const hayIlegibles = [nombre, telefono, descripcion, notas].some(esIlegible);

  return (
    <div className="mx-auto max-w-lg">
      <h1>{request.serviceType.name}</h1>

      {hayIlegibles && <AvisoIlegible />}

      <div className="mt-4 rounded-xl border p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Cliente:</span>{" "}
          <ValorCifrado>{nombre}</ValorCifrado>
        </p>
        <p>
          <span className="text-muted-foreground">Teléfono:</span>{" "}
          <ValorCifrado>{telefono}</ValorCifrado>
        </p>
        <p className="mt-2 whitespace-pre-line">
          <ValorCifrado>{descripcion}</ValorCifrado>
        </p>
        <ReferencePhoto url={request.referenceImageUrl} />
      </div>

      <form action={updateServiceRequest} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={request.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">
            <ClipboardList className="size-5 text-primary" />
            Estado
          </Label>
          <select
            id="status"
            name="status"
            defaultValue={request.status}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quotedPrice">
            <DollarSign className="size-5 text-primary" />
            Precio cotizado (opcional)
          </Label>
          <Input
            id="quotedPrice"
            name="quotedPrice"
            type="number"
            min={0}
            step="1"
            defaultValue={request.quotedPrice?.toString() ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adminNotes">
            <NotebookPen className="size-5 text-primary" />
            Notas internas (opcional)
          </Label>
          <Textarea
            id="adminNotes"
            name="adminNotes"
            rows={3}
            // Si las notas no se pudieron descifrar va vacío, nunca el aviso:
            // guardar el formulario escribiría ese texto encima de las notas.
            defaultValue={notas && !esIlegible(notas) ? notas : ""}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">Revisá los datos e intentá de nuevo.</p>
        )}
        <Button type="submit" className="mt-2">
          <Save />
          Guardar
        </Button>
      </form>
    </div>
  );
}
