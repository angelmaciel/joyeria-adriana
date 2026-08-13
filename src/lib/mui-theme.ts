import { createTheme } from "@mui/material/styles";
import { esES } from "@mui/material/locale";

// Los colores de marca son la fuente de verdad en globals.css (:root, en oklch).
// Acá van los mismos tonos en hex porque MUI no los usa tal cual: los pasa por
// alpha() / lighten() / darken() para derivar hover, disabled, bordes y sombras.
// Ese colorManipulator parsea hex, rgb y hsl; con oklch no se puede confiar en
// que derive bien. Si se toca la paleta en globals.css, actualizar también acá.
//
// El dorado es oscuro a propósito: es el tono más claro que todavía da 4.68:1
// con letra blanca encima (AA) y 4.57:1 como texto sobre el fondo. Un oro más
// brillante sobre blanco no llega al mínimo en ninguno de los dos usos.
const marca = {
  fondo: "#fdfcfa", // --background
  superficie: "#ffffff", // --card / --popover
  oro: "#906f23", // --primary
  sobreOro: "#ffffff", // --primary-foreground
  secundario: "#f4f1ea", // --secondary
  sobreSecundario: "#44403c", // --secondary-foreground
  texto: "#1c1917", // --foreground
  textoTenue: "#6b6259", // --muted-foreground
  error: "#c62828", // --destructive
  borde: "#e0d7c3", // --border
} as const;

// Playfair para títulos, igual que la regla de h1 en globals.css. Derecha, sin
// itálica ni espaciado extra.
const titulo = {
  fontFamily: "var(--font-playfair), Georgia, serif",
  fontWeight: 600,
} as const;

export const muiTheme = createTheme(
  {
    // Con variables CSS los tokens quedan en :root y se pueden leer desde
    // Tailwind mientras conviven las dos capas.
    cssVariables: { colorSchemeSelector: "class" },
    defaultColorScheme: "light",
    palette: {
      mode: "light",
      primary: { main: marca.oro, contrastText: marca.sobreOro },
      secondary: { main: marca.secundario, contrastText: marca.sobreSecundario },
      error: { main: marca.error },
      background: { default: marca.fondo, paper: marca.superficie },
      text: { primary: marca.texto, secondary: marca.textoTenue },
      divider: marca.borde,
    },
    shape: {
      borderRadius: 10, // --radius: 0.625rem
    },
    // Las curvas nativas son demasiado débiles para que el movimiento se lea.
    // Estas son las mismas que --ease-out-quint / --ease-in-out-strong en
    // globals.css, para que un componente de MUI y uno de Tailwind al lado se
    // muevan igual.
    transitions: {
      easing: {
        easeOut: "cubic-bezier(0.23, 1, 0.32, 1)",
        easeInOut: "cubic-bezier(0.77, 0, 0.175, 1)",
      },
    },
    typography: {
      // next/font ya carga las fuentes en el layout raíz y expone estas
      // variables; referenciarlas evita volver a pedirlas.
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      h1: titulo,
      h2: titulo,
      h3: titulo,
      h4: titulo,
      // Material pone los botones en mayúsculas; el resto del sitio no.
      button: { textTransform: "none", fontWeight: 500 },
    },
  },
  esES,
);
