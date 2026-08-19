"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { esES as gridEsES } from "@mui/x-data-grid/locales";
import { esES as pickersEsES } from "@mui/x-date-pickers/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { muiTheme } from "@/lib/mui-theme";

// Los locales de MUI X y el LocalizationProvider se montan acá y no en el
// layout raíz a propósito: si fueran al theme global, el catálogo y las demás
// páginas públicas cargarían las traducciones de la grilla y los selectores de
// fecha sin usarlas nunca. El panel es el único lugar donde hacen falta.
const temaPanel = createTheme(muiTheme, gridEsES, pickersEsES);

export function MuiAdminProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={temaPanel}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
