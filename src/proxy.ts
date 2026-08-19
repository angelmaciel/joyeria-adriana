import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { CLIENT_MODE_COOKIE } from "@/lib/client-mode";

// Las dos comprobaciones viven acá, en el proxy, y no en los layouts.
//
// El motivo no es estilístico: los layouts se renderizan dentro de un límite de
// Suspense en cuanto la ruta tiene un loading.tsx, y para entonces el shell de
// la respuesta ya se empezó a enviar. Un redirect() de un layout en ese punto
// deja de producir una redirección del servidor y la página se sirve igual con
// código 200. El proxy corre ANTES de renderizar, así que no depende de eso.

function esRutaDeCliente(pathname: string) {
  return (
    pathname === "/inicio" ||
    pathname === "/catalogo" ||
    pathname === "/vender-oro" ||
    pathname === "/sobre-nosotros" ||
    pathname === "/confirmacion" ||
    pathname === "/servicios" ||
    pathname.startsWith("/servicios/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zona pública: solo separa los dos modos de uso del sitio. No protege datos
  // —la ficha de producto queda abierta a propósito, para poder compartirla—,
  // así que alcanza con mirar que la cookie esté puesta.
  if (esRutaDeCliente(pathname)) {
    const modoCliente =
      request.cookies.get(CLIENT_MODE_COOKIE)?.value === "1";
    if (!modoCliente) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Panel: acá sí es seguridad. Antes se miraba solo que EXISTIERA la cookie de
  // sesión, y con eso mandar cualquier basura alcanzaba para que la página se
  // renderizara: el HTML del panel viajaba en el cuerpo aunque después
  // redirigiera. getToken verifica la FIRMA con AUTH_SECRET; no consulta la
  // base, así que corre en este runtime.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

// login y recuperar quedan fuera: son justamente las rutas para quien no tiene
// sesión. /producto/[slug] tampoco entra: es abierta a propósito.
export const config = {
  matcher: [
    "/admin/((?!login|recuperar).*)",
    "/inicio",
    "/catalogo",
    "/vender-oro",
    "/sobre-nosotros",
    "/confirmacion",
    "/servicios/:path*",
  ],
};
