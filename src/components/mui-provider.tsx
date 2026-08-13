"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/lib/mui-theme";

// enableCssLayer mete los estilos de Emotion en @layer mui. El orden de capas
// se declara en globals.css: mui queda por encima del preflight de Tailwind
// (que si no le pisaría fondos y bordes a los componentes de Material) y por
// debajo de las utilities (así una clase suelta todavía puede ajustar un
// componente de MUI mientras dure la migración).
//
// Sin CssBaseline a propósito: el reset lo sigue haciendo el preflight de
// Tailwind, del que dependen las pantallas que todavía usan shadcn. CssBaseline
// entra recién cuando se vaya el último componente de shadcn.
export function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
