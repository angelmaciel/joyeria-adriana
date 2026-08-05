import { redirect } from "next/navigation";
import { isClientMode } from "@/lib/client-mode";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const active = await isClientMode();
  if (!active) redirect("/");

  return <>{children}</>;
}
