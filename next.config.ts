import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Todo origen del que se carguen imágenes tiene que estar en img-src, además de
// en images.remotePatterns: si falta acá, el navegador bloquea la imagen aunque
// la URL funcione perfecto (se ve el recuadro roto y no hay error de servidor).
const ORIGENES_DE_IMAGENES = [
  "https://res.cloudinary.com", // fotos de productos y de solicitudes
  "https://placehold.co", // imágenes de ejemplo del catálogo inicial
].join(" ");

// 'unsafe-eval' solo en dev: lo necesita el hot reload de Turbopack.
// 'unsafe-inline' en style-src es necesario para los estilos inline de Next/Tailwind.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${ORIGENES_DE_IMAGENES}`,
  "font-src 'self' data:",
  "connect-src 'self'" + (isDev ? " ws: http://localhost:*" : ""),
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Las fotos de celular pesan varios MB y el límite por defecto (1 MB) las
      // rechazaba. Se deja bien por encima de MAX_SIZE_BYTES (8 MB, en
      // src/lib/uploads.ts) a propósito: así el archivo llega hasta nuestro
      // código y el usuario ve "la foto pesa demasiado" en vez del 500 crudo de
      // Next. Solo un archivo absurdo (>12 MB) cae en el error sin formato.
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
