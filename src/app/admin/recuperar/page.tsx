import Link from "next/link";
import { Mail, Send, CircleCheckBig } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function RecuperarPage({
  searchParams,
}: PageProps<"/admin/recuperar">) {
  const { enviado, error, min } = await searchParams;

  if (enviado) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <CircleCheckBig className="size-10 text-primary" />
        <h1>Revisá tu correo</h1>
        <p className="text-muted-foreground">
          Si el email está registrado, te enviamos un enlace para crear una nueva
          contraseña. Vence en 24 horas.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/login" />}>
          Volver al ingreso
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-center">Recuperar contraseña</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Ingresá tu email y te mandamos un enlace para crear una nueva contraseña.
      </p>
      <form action={requestPasswordReset} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            <Mail className="size-5 text-primary" />
            Email
          </Label>
          <Input id="email" name="email" type="email" required autoFocus />
        </div>
        {error === "rate" && (
          <p className="text-sm text-destructive">
            Ya pediste el enlace varias veces. Probá de nuevo en{" "}
            {typeof min === "string" ? `${min} minuto${min === "1" ? "" : "s"}` : "unos minutos"}.
          </p>
        )}
        <Button type="submit" className="mt-2">
          <Send />
          Enviar enlace
        </Button>
        <Link
          href="/admin/login"
          className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Volver al ingreso
        </Link>
      </form>
    </div>
  );
}
