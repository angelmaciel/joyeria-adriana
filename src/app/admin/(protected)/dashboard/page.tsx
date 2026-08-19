import { ClipboardList, Coins, Package, TrendingUp, Eye } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/constants";
import {
  GraficoEstados,
  GraficoPorServicio,
  ProductosMasVistos,
} from "@/components/graficos-dashboard";

function inicioDelMes() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
}

function Tarjeta({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof ClipboardList;
  etiqueta: string;
  valor: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
      <Icono className="text-primary size-8" />
      <p className="text-muted-foreground text-sm">{etiqueta}</p>
      <p className="text-2xl font-semibold">{valor}</p>
    </div>
  );
}

function Panel({
  icono: Icono,
  titulo,
  children,
}: {
  icono: typeof ClipboardList;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center justify-center gap-1.5 text-lg font-medium">
        <Icono className="text-primary size-5" />
        {titulo}
      </h2>
      <div className="rounded-xl border p-2">{children}</div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();

  const [
    serviciosPendientes,
    oroPendientes,
    productosActivos,
    estadosServicio,
    estadosOro,
    masVistos,
    porTipoEsteMes,
    tiposDeServicio,
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: "PENDIENTE" } }),
    prisma.goldPurchaseRequest.count({ where: { status: "PENDIENTE" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.serviceRequest.groupBy({ by: ["status"], _count: true }),
    prisma.goldPurchaseRequest.groupBy({ by: ["status"], _count: true }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.serviceRequest.groupBy({
      by: ["serviceTypeId"],
      _count: true,
      where: { createdAt: { gte: inicioDelMes() } },
    }),
    prisma.serviceType.findMany(),
  ]);

  // Los dos tipos de solicitud se suman: al operador le importa cuanto trabajo
  // hay en cada estado, no de que formulario vino.
  const porEstado = REQUEST_STATUSES.map((estado) => ({
    estado: estado as RequestStatus,
    total:
      (estadosServicio.find((c) => c.status === estado)?._count ?? 0) +
      (estadosOro.find((c) => c.status === estado)?._count ?? 0),
  }));

  const nombrePorId = new Map(tiposDeServicio.map((s) => [s.id, s.name]));
  const porServicio = porTipoEsteMes.map((c) => ({
    servicio: nombrePorId.get(c.serviceTypeId) ?? "Sin tipo",
    total: c._count,
  }));

  return (
    <div>
      <h1 className="text-center">Panel de administración</h1>
      <p className="text-muted-foreground mt-1 text-center">
        Bienvenida, {session?.user?.email}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tarjeta
          icono={ClipboardList}
          etiqueta="Solicitudes de servicio pendientes"
          valor={serviciosPendientes}
        />
        <Tarjeta
          icono={Coins}
          etiqueta="Compras de oro pendientes"
          valor={oroPendientes}
        />
        <Tarjeta icono={Package} etiqueta="Productos activos" valor={productosActivos} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icono={ClipboardList} titulo="Solicitudes por estado">
          <GraficoEstados datos={porEstado} />
        </Panel>
        <Panel icono={TrendingUp} titulo="Servicios pedidos este mes">
          <GraficoPorServicio datos={porServicio} />
        </Panel>
      </div>

      <div className="mt-8">
        <Panel icono={Eye} titulo="Productos más vistos">
          <ProductosMasVistos
            datos={masVistos.map((p) => ({ nombre: p.name, vistas: p.viewCount }))}
          />
        </Panel>
      </div>
    </div>
  );
}
