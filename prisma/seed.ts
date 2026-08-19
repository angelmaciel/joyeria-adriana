import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await Promise.all(
    [
      { name: "Anillos", slug: "anillos" },
      { name: "Cadenas", slug: "cadenas" },
      { name: "Pulseras", slug: "pulseras" },
      { name: "Relojes", slug: "relojes" },
      { name: "Aros", slug: "aros" },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    )
  );

  const anillos = categories.find((c) => c.slug === "anillos")!;
  const cadenas = categories.find((c) => c.slug === "cadenas")!;
  const aros = categories.find((c) => c.slug === "aros")!;

  const products = [
    {
      name: "Anillo de oro 18k con circonia",
      slug: "anillo-oro-18k-circonia",
      description:
        "Anillo clásico de oro amarillo 18k con circonia central. Ideal para regalo o uso diario.",
      categoryId: anillos.id,
      price: 85000,
      images: ["https://placehold.co/800x800?text=Anillo+18k"],
    },
    {
      name: "Cadena de oro 18k Figaro",
      slug: "cadena-oro-18k-figaro",
      description: "Cadena Figaro en oro 18k, 50cm, ideal para dije.",
      categoryId: cadenas.id,
      price: 120000,
      images: ["https://placehold.co/800x800?text=Cadena+Figaro"],
    },
    {
      name: "Aros de plata 925 con perla",
      slug: "aros-plata-925-perla",
      description: "Aros colgantes de plata 925 con perla cultivada.",
      categoryId: aros.id,
      priceVisible: false,
      images: ["https://placehold.co/800x800?text=Aros+Perla"],
    },
  ];

  for (const p of products) {
    const { images, ...data } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        images: { create: images.map((url, order) => ({ url, order })) },
      },
    });
  }

  const serviceTypes = [
    {
      name: "Limpieza básica",
      slug: "limpieza-basica",
      hasFixedPrice: true,
      fixedPrice: 5000,
      description: "Limpieza y abrillantado de la pieza.",
    },
    {
      name: "Reparación general",
      slug: "reparacion-general",
      hasFixedPrice: false,
      description: "Soldaduras, ajustes de talles, cambio de broches, etc. Se cotiza según la pieza.",
    },
    {
      name: "Fabricación a medida",
      slug: "fabricacion-a-medida",
      hasFixedPrice: false,
      description: "Diseño y fabricación de piezas únicas a partir de una referencia o boceto.",
    },
  ];

  for (const s of serviceTypes) {
    await prisma.serviceType.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  // La cuenta de administración sale del entorno, nunca del código: este
  // archivo se versiona, y tener acá el email y la contraseña equivale a
  // publicar un par de credenciales del panel en un repositorio.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administración";

  if (!adminEmail || !adminPassword) {
    console.log(
      "Sin SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD: no se crea cuenta de administración."
    );
    console.log("Catálogo y servicios cargados igual.");
    return;
  }

  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres.");
  }

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  console.log("Seed completado.");
  console.log(`Cuenta de administración lista para ${adminEmail}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
