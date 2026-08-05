import { Tag, Layers, Text, DollarSign, Image as ImageIcon, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NuevoProductoPage({
  searchParams,
}: PageProps<"/admin/productos/nuevo">) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-lg">
      <h1>Nuevo producto</h1>

      <form action={createProduct} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            <Tag className="size-5 text-primary" />
            Nombre
          </Label>
          <Input id="name" name="name" required minLength={2} />
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
          <Textarea id="description" name="description" required minLength={5} rows={3} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">
            <DollarSign className="size-5 text-primary" />
            Precio (opcional)
          </Label>
          <Input id="price" name="price" type="number" min={0} step="1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="priceVisible" defaultChecked className="size-4" />
          Mostrar precio públicamente
        </label>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="images">
            <ImageIcon className="size-5 text-primary" />
            Fotos
          </Label>
          <input
            id="images"
            name="images"
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
          <Plus />
          Crear producto
        </Button>
      </form>
    </div>
  );
}
