"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { iniciarSesion, type EstadoLogin } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PantallaCargando } from "@/components/pantalla-cargando";

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(
    iniciarSesion,
    null
  );

  // Los campos son controlados a propósito. React limpia los formularios no
  // controlados después de ejecutar una acción, así que un intento fallido
  // borraba lo escrito y obligaba a tipear el email de nuevo para corregir solo
  // la contraseña. Con el valor en estado, lo que se escribió sobrevive.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">
          <Mail className="text-primary size-5" />
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={estado ? true : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          <Lock className="text-primary size-5" />
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={estado ? true : undefined}
            // Espacio a la derecha para que el texto no pase por debajo del ojo.
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            // aria-pressed porque es un interruptor: el lector de pantalla tiene
            // que poder decir si la contraseña está visible o no.
            aria-pressed={verClave}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg transition-colors outline-none focus-visible:ring-3"
          >
            {verClave ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {estado && (
        // role="alert" para que el lector de pantalla lo anuncie al aparecer:
        // si no, quien no ve la pantalla no se entera de que falló.
        <p role="alert" className="text-destructive text-sm">
          {estado.error}
        </p>
      )}

      <Button type="submit" className="mt-2" disabled={pendiente}>
        Ingresar
      </Button>

      {pendiente && <PantallaCargando />}
    </form>
  );
}
