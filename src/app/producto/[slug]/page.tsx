import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { buildProductWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { formatGuaranies } from "@/lib/utils";
import { imagenOptimizada } from "@/lib/cloudinary";

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { images: { orderBy: { order: "asc" } }, category: true },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const image = product.images[0]?.url;
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductoPage({
  params,
}: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const productUrl = `${siteUrl}/producto/${product.slug}`;
  const waLink = buildWhatsAppLink(
    buildProductWhatsAppMessage(product.name, productUrl)
  );

  return (
    <div className="animate-fade-up mx-auto w-full max-w-4xl px-4 py-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="grid gap-2">
          {product.images.map((image) => (
            <Image
              key={image.id}
              src={imagenOptimizada(image.url, 900)}
              alt={product.name}
              width={800}
              height={800}
              unoptimized
              className="w-full rounded-xl object-cover"
              priority
            />
          ))}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
          <h1 className="mt-1">{product.name}</h1>
          {product.priceVisible && product.price != null ? (
            <p className="mt-2 text-xl font-medium">
              {formatGuaranies(product.price)}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">Consultar precio</p>
          )}
          <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">
            {product.description}
          </p>
          <Button
            size="lg"
            nativeButton={false}
            className="mt-6 w-full bg-[#25D366] text-white hover:bg-[#1ebe57]"
            render={<a href={waLink} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle />
            Consultar por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
