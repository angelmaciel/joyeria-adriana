import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Mail, Lock } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw error;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { error, reset } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center">Ingreso administrador</h1>
      <form action={login} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            <Mail className="size-5 text-primary" />
            Email
          </Label>
          <Input id="email" name="email" type="email" required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            <Lock className="size-5 text-primary" />
            Contraseña
          </Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {reset && (
          <p className="text-sm text-primary">
            Contraseña actualizada. Ya podés ingresar.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">Email o contraseña incorrectos.</p>
        )}
        <Button type="submit" className="mt-2">
          Ingresar
        </Button>
        <Link
          href="/admin/recuperar"
          className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
    </div>
  );
}
