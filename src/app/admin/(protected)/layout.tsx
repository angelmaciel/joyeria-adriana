import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList, Coins } from "lucide-react";
import { auth } from "@/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: ClipboardList },
  { href: "/admin/compra-oro", label: "Compra de oro", icon: Coins },
] as const;

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <nav className="mb-6 flex flex-wrap gap-4 border-b pb-4 text-sm font-medium">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 hover:text-primary hover:underline"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
