import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { TablaSolicitudes, type FilaSolicitud } from "@/components/tabla-solicitudes";
import type { RequestStatus } from "@/lib/constants";

export default async function AdminCompraOroPage() {
  const requests = await prisma.goldPurchaseRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const filas: FilaSolicitud[] = requests.map((r) => ({
    id: r.id,
    cliente: decrypt(r.clientName),
    telefono: decrypt(r.clientPhone),
    detalle: decrypt(r.description),
    estado: r.status as RequestStatus,
    creada: r.createdAt.toISOString(),
    precio: r.offeredPrice ? Number(r.offeredPrice) : null,
  }));

  return (
    <div>
      <h1>Compra de oro</h1>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        {filas.length === 0
          ? "Todavía no hay solicitudes."
          : `${filas.length} ${filas.length === 1 ? "solicitud" : "solicitudes"}. Tocá una fila para abrirla.`}
      </p>
      <TablaSolicitudes
        filas={filas}
        rutaBase="/admin/compra-oro"
        etiquetaPrecio="Ofrecido"
      />
    </div>
  );
}
