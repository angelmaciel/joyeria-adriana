import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Gem, Ban, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { imagenOptimizada } from "@/lib/cloudinary";
import { toggleProductActive } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/delete-product-button";

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
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
          >
            {p.images[0] ? (
              <Image
                src={imagenOptimizada(p.images[0].url, 120)}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                <Gem className="size-5 text-muted-foreground/40" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.category.name}</p>
            </div>

            <Badge variant={p.isActive ? "default" : "outline"}>
              {p.isActive ? "Activo" : "Inactivo"}
            </Badge>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/admin/productos/${p.id}`} />}
              >
                <Pencil />
                Editar
              </Button>

              {/* Desactivar es lo reversible: lo saca del catálogo sin perder nada. */}
              <form action={toggleProductActive}>
                <input type="hidden" name="id" value={p.id} />
                <Button size="sm" variant="outline" type="submit">
                  {p.isActive ? <Ban /> : <RotateCcw />}
                  {p.isActive ? "Desactivar" : "Activar"}
                </Button>
              </form>

              <DeleteProductButton id={p.id} name={p.name} />
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-muted-foreground">Todavía no hay productos.</p>
        )}
      </div>
    </div>
  );
}
