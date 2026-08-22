import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { prisma } from "@/lib/prisma";
import { formatGuaranies } from "@/lib/utils";
import { CUSTOM_ORDER_SLUG } from "@/lib/constants";

export default async function ServiciosPage() {
  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true, slug: { not: CUSTOM_ORDER_SLUG } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-fade-up mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-center">Servicios</h1>
      <div className="flex flex-col gap-4">
        {serviceTypes.map((service) => (
          <Card key={service.id} className="tarjeta-interactiva h-full">
            <CardActionArea href={`/servicios/solicitar/${service.slug}`}>
              <CardContent className="flex flex-col gap-1">
                <Typography variant="subtitle1" component="h2">
                  {service.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {service.description}
                </Typography>
                <p className="mt-1 text-sm font-medium">
                  {service.hasFixedPrice && service.fixedPrice != null
                    ? formatGuaranies(service.fixedPrice)
                    : "A cotizar"}
                </p>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </div>
      {serviceTypes.length === 0 && (
        <p className="text-muted-foreground">Todavía no hay servicios cargados.</p>
      )}
    </div>
  );
}
