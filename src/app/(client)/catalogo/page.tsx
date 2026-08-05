import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatGuaranies } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function CatalogoPage({
  searchParams,
}: PageProps<"/catalogo">) {
  const { categoria } = await searchParams;
  const categoriaSlug = typeof categoria === "string" ? categoria : undefined;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoriaSlug ? { category: { slug: categoriaSlug } } : {}),
      },
      include: { images: { orderBy: { order: "asc" }, take: 1 }, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-center">Catálogo</h1>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        <Link href="/catalogo">
          <Badge variant={!categoriaSlug ? "default" : "outline"}>Todos</Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/catalogo?categoria=${c.slug}`}>
            <Badge variant={categoriaSlug === c.slug ? "default" : "outline"}>
              {c.name}
            </Badge>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <Link key={product.id} href={`/producto/${product.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              {product.images[0] && (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  width={400}
                  height={400}
                  unoptimized
                  priority={index === 0}
                  className="aspect-square w-full object-cover"
                />
              )}
              <CardContent className="gap-1">
                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                <CardTitle>{product.name}</CardTitle>
                {product.priceVisible && product.price != null ? (
                  <p className="font-medium">
                    {formatGuaranies(product.price)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Consultar precio</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-muted-foreground">Todavía no hay productos cargados.</p>
      )}
    </div>
  );
}
