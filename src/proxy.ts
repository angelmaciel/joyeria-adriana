import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

// Chequeo barato de presencia de cookie: el proxy no puede validar la firma del
// token (bcrypt/Prisma no corren en este runtime). La verificación real de sesión
// vive en admin/(protected)/layout.tsx y en requireAdmin() dentro de cada acción.
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name)
  );

  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// login y recuperar quedan fuera: son justamente las rutas para quien no tiene sesión.
export const config = {
  matcher: ["/admin/((?!login|recuperar).*)"],
};
