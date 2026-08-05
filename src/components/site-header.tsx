import Link from "next/link";
import { Gem, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { exitClientMode, logoutAdmin } from "@/lib/actions";
import { isClientMode } from "@/lib/client-mode";
import { BUSINESS_NAME } from "@/lib/constants";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const [session, clientMode] = await Promise.all([auth(), isClientMode()]);

  const logoHref = session?.user ? "/admin/dashboard" : clientMode ? "/inicio" : "/";

  return (
    <header className="flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-1">
        <BackButton />
        <Link
          href={logoHref}
          className="flex items-center gap-1.5 px-1.5 font-semibold tracking-wide text-primary"
        >
          <Gem className="size-4 shrink-0" />
          {BUSINESS_NAME}
        </Link>
      </div>
      {session?.user ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">admin</span>
          <form action={logoutAdmin}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut />
              Cerrar sesión
            </Button>
          </form>
        </div>
      ) : (
        clientMode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">cliente</span>
            <form action={exitClientMode}>
              <Button variant="outline" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        )
      )}
    </header>
  );
}
