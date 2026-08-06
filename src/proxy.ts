import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Antes acá solo se miraba que EXISTIERA la cookie de sesión. Con eso, mandar
// una cookie con cualquier basura alcanzaba para que el proxy dejara pasar; el
// layout después redirigía, pero la página ya se había renderizado y el HTML del
// panel viajaba en el cuerpo de la respuesta. Es decir: ignorando la redirección
// se podían leer los datos de administración sin estar autenticado.
//
// getToken verifica la FIRMA del token con AUTH_SECRET. No consulta la base, así
// que corre en este runtime, y una cookie inventada no pasa la verificación.
export async function proxy(request: NextRequest) {
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

// login y recuperar quedan fuera: son justamente las rutas para quien no tiene sesión.
export const config = {
  matcher: ["/admin/((?!login|recuperar).*)"],
};
