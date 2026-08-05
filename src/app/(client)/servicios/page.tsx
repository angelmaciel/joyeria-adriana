import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { formatGuaranies } from "@/lib/utils";

export default async function ServiciosPage() {
  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-center">Servicios</h1>
      <div className="flex flex-col gap-4">
        {serviceTypes.map((service) => (
          <Link key={service.id} href={`/servicios/solicitar/${service.slug}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="gap-1">
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
                <p className="mt-1 text-sm font-medium">
                  {service.hasFixedPrice && service.fixedPrice != null
                    ? formatGuaranies(service.fixedPrice)
                    : "A cotizar"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {serviceTypes.length === 0 && (
        <p className="text-muted-foreground">Todavía no hay servicios cargados.</p>
      )}
    </div>
  );
}
