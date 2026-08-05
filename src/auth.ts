import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, LOGIN_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const useSecureCookies = process.env.NODE_ENV === "production";

class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Auth.js solo deduce la URL pública por su cuenta en Vercel; en cualquier otro
  // host hay que habilitarlo explícitamente o rechaza todo con "UntrustedHost".
  // Es seguro porque la app nunca queda expuesta directo: siempre hay un proxy
  // (Render en producción, next dev en local) que fija el Host.
  // Para que los redirects apunten al dominio público y no al puerto interno,
  // definir AUTH_URL como variable de entorno — asignarla por código acá NO
  // funciona: @auth/core ya leyó el entorno para entonces.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const ip = await getClientIp();
        const { allowed } = checkRateLimit(
          `login:${ip}`,
          LOGIN_LIMIT.limit,
          LOGIN_LIMIT.windowMs
        );
        if (!allowed) throw new TooManyAttempts();

        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        // Hash dummy cuando el usuario no existe: iguala el tiempo de respuesta
        // para no filtrar qué emails están registrados (timing attack).
        const hash = admin?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const valid = await bcrypt.compare(password, hash);
        if (!admin || !valid) return null;

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
});
