import Link from "next/link";
import { ClipboardList, Coins, Package, TrendingUp, Eye } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function AdminDashboardPage() {
  const session = await auth();

  const [
    pendingServiceRequests,
    pendingGoldRequests,
    activeProducts,
    serviceStatusCounts,
    goldStatusCounts,
    topProducts,
    serviceTypeCountsThisMonth,
    serviceTypes,
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
      where: { createdAt: { gte: startOfMonth() } },
    }),
    prisma.serviceType.findMany(),
  ]);

  const statusTotals = Object.fromEntries(
    REQUEST_STATUSES.map((s) => [
      s,
      (serviceStatusCounts.find((c) => c.status === s)?._count ?? 0) +
        (goldStatusCounts.find((c) => c.status === s)?._count ?? 0),
    ])
  ) as Record<RequestStatus, number>;

  const serviceTypeNames = new Map(serviceTypes.map((s) => [s.id, s.name]));

  return (
    <div>
      <h1 className="text-center">Panel de administración</h1>
      <p className="mt-1 text-center text-muted-foreground">
        Bienvenida, {session?.user?.email}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
          <ClipboardList className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Solicitudes de servicio pendientes</p>
          <p className="text-2xl font-semibold">{pendingServiceRequests}</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
          <Coins className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Compras de oro pendientes</p>
          <p className="text-2xl font-semibold">{pendingGoldRequests}</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
          <Package className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Productos activos</p>
          <p className="text-2xl font-semibold">{activeProducts}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center justify-center gap-1.5 text-lg font-medium">
            <ClipboardList className="size-5 text-primary" />
            Solicitudes por estado
          </h2>
          <div className="flex flex-col gap-2 rounded-xl border p-4">
            {REQUEST_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{REQUEST_STATUS_LABELS[s]}</span>
                <span className="font-medium">{statusTotals[s]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center justify-center gap-1.5 text-lg font-medium">
            <TrendingUp className="size-5 text-primary" />
            Solicitudes de servicio este mes
          </h2>
          <div className="flex flex-col gap-2 rounded-xl border p-4">
            {serviceTypeCountsThisMonth.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no hay solicitudes este mes.</p>
            )}
            {serviceTypeCountsThisMonth.map((c) => (
              <div key={c.serviceTypeId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {serviceTypeNames.get(c.serviceTypeId) ?? "—"}
                </span>
                <span className="font-medium">{c._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 flex items-center justify-center gap-1.5 text-lg font-medium">
          <Eye className="size-5 text-primary" />
          Productos más vistos
        </h2>
        <div className="flex flex-col gap-2 rounded-xl border p-4">
          {topProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay productos activos.</p>
          )}
          {topProducts.map((p) => (
            <Link
              key={p.id}
              href={`/admin/productos/${p.id}`}
              className="flex items-center justify-between text-sm hover:underline"
            >
              <span>{p.name}</span>
              <span className="font-medium text-muted-foreground">{p.viewCount} vistas</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
