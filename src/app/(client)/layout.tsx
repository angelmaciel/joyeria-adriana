// El control de la cookie de cliente NO va acá: vive en src/proxy.ts.
//
// Estuvo en este layout y dejó de funcionar en silencio al agregar los
// loading.tsx: con un límite de Suspense arriba, el layout se renderiza cuando
// el shell de la respuesta ya salió, y un redirect() en ese momento no produce
// una redirección del servidor —la página se sirve igual, con código 200—.
// El proxy corre antes de renderizar y no tiene ese problema.
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
