import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { ValorCifrado } from "@/components/dato-cifrado";
import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

export default async function AdminCompraOroPage({
  searchParams,
}: PageProps<"/admin/compra-oro">) {
  const { status } = await searchParams;
  const filter =
    typeof status === "string" && REQUEST_STATUSES.includes(status as RequestStatus)
      ? (status as RequestStatus)
      : undefined;

  const requests = await prisma.goldPurchaseRequest.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1>Compra de oro</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/compra-oro">
          <Badge variant={!filter ? "default" : "outline"}>Todas</Badge>
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link key={s} href={`/admin/compra-oro?status=${s}`}>
            <Badge variant={filter === s ? "default" : "outline"}>
              {REQUEST_STATUS_LABELS[s]}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {requests.map((r) => (
          <Link key={r.id} href={`/admin/compra-oro/${r.id}`}>
            <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50">
              <div>
                <p className="font-medium">
                  <ValorCifrado>{decrypt(r.clientName)}</ValorCifrado>
                </p>
                <p className="text-sm text-muted-foreground">
                  <ValorCifrado>{decrypt(r.clientPhone)}</ValorCifrado> ·{" "}
                  {r.createdAt.toLocaleDateString("es-PY")}
                </p>
              </div>
              <Badge>{REQUEST_STATUS_LABELS[r.status as RequestStatus]}</Badge>
            </div>
          </Link>
        ))}
        {requests.length === 0 && (
          <p className="text-muted-foreground">No hay solicitudes en esta vista.</p>
        )}
      </div>
    </div>
  );
}
