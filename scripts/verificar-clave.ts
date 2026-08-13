/**
 * Verifica que la ENCRYPTION_KEY del entorno sea la que abre los datos de la
 * base. Solo lee: no escribe ni modifica nada.
 *
 *   npm run check:key
 *
 * Correrlo después de cada despliegue y cada vez que se toque el entorno. Sale
 * con código 1 si algo no cierra, así que sirve en CI o en un hook de deploy.
 *
 * Existe porque una clave equivocada no da error por sí sola: el cifrado sigue
 * funcionando para lo nuevo y lo viejo queda ilegible sin que nadie se entere
 * hasta que alguien abre el panel y ve basura.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { keyFingerprint } from "../src/lib/crypto";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Saca la huella de un dato cifrado, o null si no tiene el formato nuevo. */
function huellaDe(valor: string | null): string | null {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length === 5 && partes[0] === "v1") return partes[1];
  if (partes.length === 3) return "(formato viejo, sin huella)";
  return null;
}

async function main() {
  let huellaActual: string;
  try {
    huellaActual = keyFingerprint();
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`Huella de la ENCRYPTION_KEY actual: ${huellaActual}\n`);

  const encontradas = new Map<string, number>();
  let totalCifrados = 0;

  const servicios = await prisma.serviceRequest.findMany({
    select: {
      clientName: true,
      clientPhone: true,
      clientEmail: true,
      description: true,
      adminNotes: true,
    },
  });
  const oro = await prisma.goldPurchaseRequest.findMany({
    select: {
      clientName: true,
      clientPhone: true,
      description: true,
      adminNotes: true,
    },
  });

  for (const fila of [...servicios, ...oro]) {
    for (const valor of Object.values(fila) as (string | null)[]) {
      const huella = huellaDe(valor);
      if (!huella) continue;
      totalCifrados++;
      encontradas.set(huella, (encontradas.get(huella) ?? 0) + 1);
    }
  }

  console.log(
    `Filas revisadas: ServiceRequest=${servicios.length}  GoldPurchaseRequest=${oro.length}`
  );
  console.log(`Valores cifrados: ${totalCifrados}\n`);

  if (totalCifrados === 0) {
    console.log("✓ No hay datos cifrados todavía. Cualquier clave sirve, pero");
    console.log("  a partir de la primera solicitud queda fijada: no cambiarla.");
    await prisma.$disconnect();
    return;
  }

  const ajenas = [...encontradas.entries()].filter(([h]) => h !== huellaActual);

  for (const [huella, cantidad] of encontradas) {
    const marca = huella === huellaActual ? "✓" : "✗";
    console.log(`  ${marca} huella ${huella}: ${cantidad} valores`);
  }

  if (ajenas.length > 0) {
    console.error("\n✗ Hay datos cifrados con OTRA clave.");
    console.error("  La ENCRYPTION_KEY de este entorno no es la que los abre.");
    console.error("  No la cambies para 'arreglarlo': revisá que .env y el");
    console.error("  entorno de despliegue tengan exactamente el mismo valor.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\n✓ Todos los datos cifrados corresponden a esta clave.");
  await prisma.$disconnect();
}

main();
