import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { ok } = await searchParams;

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center">Ingreso administrador</h1>

      {/* resetPassword redirige acá con este parámetro; sin esto, cambiar la
          contraseña dejaba a la persona en el login sin ninguna confirmación de
          que había funcionado. */}
      {ok === "password_actualizada" && (
        <p className="border-primary/30 bg-accent/50 text-foreground mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm">
          <CircleCheck className="text-primary size-4 shrink-0" />
          Tu contraseña se actualizó. Ingresá con la nueva.
        </p>
      )}

      {/* El error del ingreso ya no viaja por la URL: lo maneja el formulario
          para no perder lo que la persona escribió. */}
      <LoginForm />

      <Link
        href="/admin/recuperar"
        className="text-muted-foreground hover:text-foreground mt-4 text-center text-sm hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </div>
  );
}
