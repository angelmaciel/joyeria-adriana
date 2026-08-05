import Image from "next/image";
import { ImageOff } from "lucide-react";
import { imagenOptimizada } from "@/lib/cloudinary";

// Las fotos guardadas en el disco de Render desaparecen en cada despliegue, así
// que puede haber solicitudes viejas cuya ruta ya no resuelve. Se avisa en vez
// de mostrar el ícono de imagen rota del navegador.
export function ReferencePhoto({ url }: { url: string | null }) {
  if (!url) return null;

  const esPermanente = url.startsWith("http");

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs text-muted-foreground">Foto enviada por el cliente</p>
      <a
        href={imagenOptimizada(url, 1600)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <Image
          src={imagenOptimizada(url, 700)}
          alt="Foto de referencia enviada por el cliente"
          width={600}
          height={600}
          unoptimized
          className="w-full max-w-sm rounded-lg border object-contain transition-opacity hover:opacity-90"
        />
      </a>
      {!esPermanente && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <ImageOff className="size-3.5" />
          Guardada en disco temporal: puede haberse borrado en un despliegue.
        </p>
      )}
    </div>
  );
}
