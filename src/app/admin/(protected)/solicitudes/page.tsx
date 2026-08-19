import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { TablaSolicitudes, type FilaSolicitud } from "@/components/tabla-solicitudes";
import type { RequestStatus } from "@/lib/constants";

export default async function AdminSolicitudesPage() {
  const requests = await prisma.serviceRequest.findMany({
    include: { serviceType: true },
    orderBy: { createdAt: "desc" },
  });

  // El filtro por estado ya no viaja en la URL: la grilla filtra, ordena y
  // busca del lado del cliente sobre el conjunto completo. Con el volumen de
  // una joyeria eso es instantaneo y evita un viaje al servidor por cada clic.
  const filas: FilaSolicitud[] = requests.map((r) => ({
    id: r.id,
    cliente: decrypt(r.clientName),
    telefono: decrypt(r.clientPhone),
    detalle: `${r.serviceType.name} — ${decrypt(r.description)}`,
    estado: r.status as RequestStatus,
    creada: r.createdAt.toISOString(),
    precio: r.quotedPrice ? Number(r.quotedPrice) : null,
  }));

  return (
    <div>
      <h1>Solicitudes de servicio</h1>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        {filas.length === 0
          ? "Todavía no hay solicitudes."
          : `${filas.length} ${filas.length === 1 ? "solicitud" : "solicitudes"}. Tocá una fila para abrirla.`}
      </p>
      <TablaSolicitudes
        filas={filas}
        rutaBase="/admin/solicitudes"
        etiquetaPrecio="Cotizado"
      />
    </div>
  );
}
