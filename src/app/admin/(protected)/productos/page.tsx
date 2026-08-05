import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Productos</h1>
        <Button nativeButton={false} render={<Link href="/admin/productos/nuevo" />}>
          <Plus />
          Nuevo producto
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {products.map((p) => (
          <Link key={p.id} href={`/admin/productos/${p.id}`}>
            <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.category.name}</p>
              </div>
              <Badge variant={p.isActive ? "default" : "outline"}>
                {p.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="text-muted-foreground">Todavía no hay productos.</p>
        )}
      </div>
    </div>
  );
}
