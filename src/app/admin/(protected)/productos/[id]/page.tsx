import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Tag,
  Layers,
  Text,
  DollarSign,
  Image as ImageIcon,
  Save,
  Ban,
  RotateCcw,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { imagenOptimizada } from "@/lib/cloudinary";
import { toggleProductActive, updateProduct } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function EditarProductoPage({
  params,
  searchParams,
}: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h1>{product.name}</h1>
        <Badge variant={product.isActive ? "default" : "outline"}>
          {product.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <form action={updateProduct} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={product.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            <Tag className="size-5 text-primary" />
            Nombre
          </Label>
          <Input id="name" name="name" required minLength={2} defaultValue={product.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">
            <Layers className="size-5 text-primary" />
            Categoría
          </Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={product.categoryId}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">
            <Text className="size-5 text-primary" />
            Descripción
          </Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={5}
            rows={3}
            defaultValue={product.description}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">
            <DollarSign className="size-5 text-primary" />
            Precio (opcional)
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={product.price?.toString() ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="priceVisible"
            defaultChecked={product.priceVisible}
            className="size-4"
          />
          Mostrar precio públicamente
        </label>
        <div className="flex flex-col gap-1.5">
          <Label>
            <ImageIcon className="size-5 text-primary" />
            Fotos actuales
          </Label>
          {product.images.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no tiene fotos.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((img) => (
              <label key={img.id} className="flex flex-col items-center gap-1 text-xs">
                <Image
                  src={imagenOptimizada(img.url, 200)}
                  alt=""
                  width={120}
                  height={120}
                  unoptimized
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <span className="flex items-center gap-1 text-destructive">
                  <input type="checkbox" name="removeImageIds" value={img.id} />
                  Quitar
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newImages">
            <ImageIcon className="size-5 text-primary" />
            Agregar fotos
          </Label>
          <input
            id="newImages"
            name="newImages"
            type="file"
            accept="image/*"
            multiple
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">Revisá los datos e intentá de nuevo.</p>
        )}
        <Button type="submit" className="mt-2">
          <Save />
          Guardar cambios
        </Button>
      </form>

      <form action={toggleProductActive} className="mt-3">
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="outline" className="w-full">
          {product.isActive ? <Ban /> : <RotateCcw />}
          {product.isActive ? "Desactivar producto" : "Reactivar producto"}
        </Button>
      </form>
    </div>
  );
}
