import { Suspense } from "react";
import Image from "next/image";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { prisma } from "@/lib/prisma";
import { formatGuaranies } from "@/lib/utils";
import { Eye, Gem } from "lucide-react";
import { imagenOptimizada } from "@/lib/cloudinary";
import { PantallaCargando } from "@/components/pantalla-cargando";
import { ChipCategoria } from "@/components/chip-categoria";

// La grilla vive aparte para poder envolverla sola en un Suspense: al cambiar
// de categoría se recarga esto y nada más. El título y los filtros no dependen
// de la consulta de productos, así que no tienen por qué desaparecer.
async function GrillaProductos({ categoriaSlug }: { categoriaSlug?: string }) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoriaSlug ? { category: { slug: categoriaSlug } } : {}),
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 }, category: true },
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-center">
        {categoriaSlug
          ? "No hay productos en esta categoría."
          : "Todavía no hay productos cargados."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        // La entrada la anima este div y el hover la Card: son dos elementos
        // distintos, así los dos transform no se pisan.
        <div
          key={product.id}
          className="animate-fade-up"
          // El escalonado se corta en la octava tarjeta: con un catálogo
          // largo, seguir sumando retardo dejaría las últimas apareciendo
          // segundos después de que la página ya se ve cargada.
          style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
        >
          <Card className="tarjeta-interactiva h-full">
            <CardActionArea
              href={`/producto/${product.slug}`}
              className="flex h-full flex-col items-stretch"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={imagenOptimizada(product.images[0].url, 400)}
                    alt={product.name}
                    width={400}
                    height={400}
                    unoptimized
                    priority={index === 0}
                    className="tarjeta-foto size-full object-cover"
                  />
                ) : (
                  // Sin esto la tarjeta queda descuadrada respecto a las que sí
                  // tienen foto, y parece un error de carga.
                  <div className="bg-muted/40 flex size-full items-center justify-center">
                    <Gem className="text-muted-foreground/40 size-8" />
                  </div>
                )}
                {/* Sube al pasar el cursor. aria-hidden porque no agrega nada
                    que un lector de pantalla no tenga ya: la tarjeta entera es
                    la acción, y el nombre del producto está abajo. */}
                <div
                  aria-hidden
                  className="tarjeta-revelado bg-primary/90 text-primary-foreground absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2 text-sm font-medium"
                >
                  <Eye className="size-4" />
                  Ver detalle
                </div>
              </div>
              <CardContent className="flex w-full flex-col gap-1 p-3">
                <p className="text-muted-foreground text-xs">
                  {product.category.name}
                </p>
                <Typography variant="subtitle1" component="h2">
                  {product.name}
                </Typography>
                {product.priceVisible && product.price != null ? (
                  <p className="font-medium">{formatGuaranies(product.price)}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Consultar precio
                  </p>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </div>
      ))}
    </div>
  );
}

// Esqueleto de la grilla con el diamante encima, acotado al área de la grilla:
// los filtros de arriba quedan visibles y usables mientras carga.
function CargandoGrilla() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton variant="rectangular" className="aspect-square w-full rounded-xl" />
            <Skeleton variant="rectangular" className="h-3 w-16 rounded-md" />
            <Skeleton variant="rectangular" className="h-4 w-3/4 rounded-md" />
            <Skeleton variant="rectangular" className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
      <PantallaCargando dentroDelContenedor className="rounded-xl" />
    </div>
  );
}

export default async function CatalogoPage({
  searchParams,
}: PageProps<"/catalogo">) {
  const { categoria } = await searchParams;
  const categoriaSlug = typeof categoria === "string" ? categoria : undefined;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-center">Catálogo</h1>
      {/* Los filtros son un componente cliente aparte: Chip no acepta href y
          la única forma de que el chip sea él mismo el enlace enfocable es
          component={Link}, que desde acá rompería el SSR. El motivo largo está
          en chip-categoria.tsx. */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        <ChipCategoria label="Todos" href="/catalogo" activo={!categoriaSlug} />
        {categories.map((c) => (
          <ChipCategoria
            key={c.id}
            label={c.name}
            href={`/catalogo?categoria=${c.slug}`}
            activo={categoriaSlug === c.slug}
          />
        ))}
      </div>

      {/* La key es lo que hace que esto funcione: sin ella React reutiliza el
          mismo límite de Suspense al cambiar de categoría y el fallback nunca
          se vuelve a mostrar. Con la key, cada filtro monta un límite nuevo. */}
      <Suspense key={categoriaSlug ?? "todos"} fallback={<CargandoGrilla />}>
        <GrillaProductos categoriaSlug={categoriaSlug} />
      </Suspense>
    </div>
  );
}
