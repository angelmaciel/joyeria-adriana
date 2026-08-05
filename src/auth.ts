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
  // Fuera de Vercel, Auth.js no puede deducir la URL pública y rechaza el login
  // con "There was a problem with the server configuration". Render siempre está
  // detrás de su proxy, que fija el Host correcto, así que es seguro confiar en él.
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
