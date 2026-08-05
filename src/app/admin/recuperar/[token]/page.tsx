import Link from "next/link";
import { Lock, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { resetPassword } from "@/lib/auth-actions";
import { hashResetToken } from "@/lib/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/admin/recuperar/[token]">) {
  const { token } = await params;
  const { error } = await searchParams;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  const isValid = record && !record.usedAt && record.expiresAt > new Date();

  if (!isValid) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1>Enlace vencido</h1>
        <p className="text-muted-foreground">
          Este enlace ya se usó o venció. Pedí uno nuevo para continuar.
        </p>
        <Button nativeButton={false} render={<Link href="/admin/recuperar" />}>
          Pedir un enlace nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center">Nueva contraseña</h1>
      <form action={resetPassword} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            <Lock className="size-5 text-primary" />
            Nueva contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">
            <Lock className="size-5 text-primary" />
            Repetir contraseña
          </Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} />
        </div>
        {error === "invalid" ? (
          <p className="text-sm text-destructive">
            El enlace ya no es válido. Pedí uno nuevo.
          </p>
        ) : (
          error && (
            <p className="text-sm text-destructive">
              Las contraseñas deben coincidir y tener al menos 8 caracteres.
            </p>
          )
        )}
        <Button type="submit" className="mt-2">
          <Save />
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
