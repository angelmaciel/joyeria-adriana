# Convenciones del proyecto

Por qué cada regla está donde está. Si algo acá parece arbitrario, casi siempre
es la cicatriz de un problema concreto: el motivo está escrito al lado.

Sitio de catálogo y captación de pedidos: catálogo de productos, solicitudes de
servicio (reparación, limpieza, fabricación a medida) y compra de oro, con un
panel de administración.

Next.js 16 (App Router) + Prisma 7 sobre PostgreSQL + NextAuth v5 + Tailwind 4.
Ver [README.md](../README.md) y [DEPLOY.md](../DEPLOY.md).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `src/app/(client)/` | Público: `inicio`, `catalogo`, `servicios`, `vender-oro`, `confirmacion` |
| `src/app/producto/[slug]/` | Ficha de producto |
| `src/app/admin/(protected)/` | Panel: `dashboard`, `productos`, `solicitudes`, `compra-oro` |
| `src/app/admin/login`, `admin/recuperar/[token]` | Ingreso y reseteo de contraseña |
| `src/lib/` | Server actions, cifrado, validaciones, uploads, mail, WhatsApp, rate limit |
| `src/components/ui/` | Componentes de shadcn/ui — no editarlos a mano, se regeneran |
| `src/generated/prisma/` | Cliente Prisma generado. **Nunca editar.** |

## Reglas del proyecto

- **Los datos de contacto van cifrados.** `clientPhone` y `clientEmail` se guardan
  con AES-256-GCM (`src/lib/crypto.ts`). Los campos `*Index` son HMAC
  determinísticos (blind index) que existen solo para poder buscar sin descifrar
  la tabla. Al escribir usar `encrypt` / `encryptOptional` + `blindIndex`; al
  buscar por teléfono o email, comparar contra el índice, nunca contra el campo
  cifrado.
- **El dato cifrado se guarda como `v1.huella.iv.tag.dato`.** La `huella` son 8
  caracteres derivados de la clave por HMAC (`keyFingerprint()`): no la revela,
  pero permite que `decrypt()` distinga "esto se cifró con OTRA clave" de "esto
  está corrupto", y lo diga en el log con las dos huellas.
- **Si `decrypt()` no puede abrir un valor, devuelve `ILEGIBLE`, no el texto
  cifrado.** Antes devolvía el payload y el panel lo mostraba en el lugar del
  nombre del cliente: el operador veía base64 sin saber por qué. Al mostrar un
  campo cifrado usar `<ValorCifrado>` (`src/components/dato-cifrado.tsx`), que
  lo marca, y `esIlegible()` para detectarlo — nunca comparar contra el texto.
  Ojo con los `defaultValue` de formularios: si va el aviso y se guarda, se
  escribe encima del dato original.
- **`ENCRYPTION_KEY` se genera una vez y no se cambia nunca.** Todos los
  entornos deben tener el mismo valor. Cambiarla deja ilegible todo lo guardado
  —no hay rotación implementada— y además rompe **en silencio** las búsquedas
  por teléfono y email, porque `blindIndex()` se deriva de la misma clave.
- **`npm run check:key` verifica que el entorno tenga la clave correcta.** Solo
  lee; sale con código 1 si encuentra datos cifrados con otra clave, así que
  sirve en CI o después de desplegar. Correrlo ante cualquier duda.
- **Los estados son `String`, no enum de Postgres, a propósito.** La fuente de
  verdad es `REQUEST_STATUSES` / `RequestStatus` en `src/lib/constants.ts` (de ahí
  salen también las etiquetas de la UI) y Zod los valida en cada escritura. Un
  estado nuevo se agrega ahí, sin migración.
- **Toda escritura pasa por Zod** (`src/lib/validations.ts`) dentro de una server
  action en `src/lib/actions.ts`.
- **Mutaciones de admin: `requireAdmin()` primero.** Formularios públicos:
  `checkRateLimit` por IP antes de tocar la base.
- **Las sesiones son JWT, no hay tabla de sesiones.** Para invalidarlas se compara
  contra `AdminUser.passwordChangedAt` — al tocar contraseñas, actualizarlo.
- De `PasswordResetToken` se guarda solo el hash: la tabla no debe permitir
  reconstruir el link enviado por email.
- Las acciones sensibles del panel se registran en `AdminAuditLog`.
- Importar el cliente de Prisma desde `@/lib/prisma`, no desde `@prisma/client`
  ni desde `src/generated/prisma` directamente.
- `fabricacion-a-medida` (`CUSTOM_ORDER_SLUG`) tiene tarjeta y formulario propios;
  no se lista junto a los servicios de reparar/limpiar.
- Las fotos de producto viven en su propia tabla (`ProductImage`), no en un
  `String[]`, porque necesitan orden.

## Migración a Material UI (en curso)

La UI se está pasando de shadcn/ui a Material UI v9 + MUI X v9, pantalla por
pantalla. Mientras dure, las dos capas conviven.

- **El theme es `src/lib/mui-theme.ts`**, montado por `MuiProvider`
  (`src/components/mui-provider.tsx`) en el layout raíz. Los colores de marca
  siguen viviendo en `globals.css` (`:root`, en oklch) — el theme los repite en
  hex porque MUI deriva hover/disabled/bordes con `alpha()`/`lighten()`, que no
  parsean oklch. **Al tocar la paleta hay que actualizar los dos lados.**
- **El orden de capas CSS lo fija `globals.css`**: `theme, base, mui, components,
  utilities`. `mui` va arriba del preflight de Tailwind (si no, le pisa fondos y
  bordes a los componentes de Material) y abajo de las utilities (para poder
  seguir ajustando un componente de MUI con una clase suelta). Emotion inyecta
  en esa capa gracias a `enableCssLayer` en el `AppRouterCacheProvider`.
- **Todavía no va `CssBaseline`.** El reset lo hace el preflight de Tailwind, del
  que dependen las pantallas que siguen en shadcn. `CssBaseline` entra al final,
  cuando se vaya el último componente de shadcn.
- El adaptador de Next es `@mui/material-nextjs/v16-appRouter`.
- **MUI X no va en el theme raíz**: sus locales (`esES` de `@mui/x-data-grid` y de
  `@mui/x-date-pickers`) y el `LocalizationProvider` se montan donde se usen —
  el panel—, para no cargarlos en las páginas públicas. El core sí trae `esES`.
- **Nunca `component={...}` en un componente de MUI desde un server component.**
  Un componente es una función y las funciones no cruzan el límite RSC: Next
  tira "Functions cannot be passed directly to Client Components" y **de-optimiza
  la ruta entera a renderizado en cliente**. Falla en silencio —build verde, tsc
  verde, HTTP 200, y en el navegador se ve bien— pero el HTML sale sin contenido,
  incluido lo que no tenía nada que ver con MUI. Para enlazar va `href` solo; el
  `LinkComponent` está puesto una vez en `MuiButtonBase` dentro del theme, que ya
  vive del lado cliente. Si hiciera falta otro `component`, la pantalla tiene que
  ser `"use client"`.
- **Al migrar una pantalla, verificar el HTML, no el navegador.** `curl` a la ruta
  y buscar el contenido: si solo aparece dentro del payload escapado de RSC y no
  como markup, la pantalla se de-optimizó. Las rutas públicas piden la cookie
  `client_mode=1` (la pone la portada, ver `src/proxy.ts`).
- Los componentes de shadcn en `src/components/ui/` se van borrando a medida que
  dejan de usarse; no hay que portarlos.

## Movimiento

- **Las curvas y animaciones son tokens de `@theme` en `globals.css`**:
  `--ease-out-quint` (entradas y salidas), `--ease-in-out-strong` (movimiento en
  pantalla), y las utilidades `animate-fade-up` / `animate-fade-soft`. El theme
  de MUI repite esas mismas curvas en `transitions.easing` para que un
  componente de Material y uno de Tailwind al lado se muevan igual. No inventar
  curvas nuevas: extender estas.
- Solo se anima `transform` y `opacity` — el resto dispara layout y reflow.
- **Nada de movimiento sin `prefers-reduced-motion`.** El bloque al final de
  `globals.css` cambia el desplazamiento por un desvanecimiento; menos
  movimiento, no cero.
- El hover que se mueve va detrás de `@media (hover: hover) and (pointer: fine)`:
  en pantallas táctiles el tap dispara un hover falso que queda pegado.
- **Las pantallas de carga (`loading.tsx`) esperan 120ms antes de aparecer**
  (`animate-fade-soft [animation-delay:120ms]`): si la navegación se resuelve
  antes, no se ve un parpadeo. El esqueleto copia la forma del contenido real
  para que nada salte de lugar al llegar.
- **La transición es `<PantallaCargando>`**: overlay `fixed` con
  `backdrop-blur-md` y el diamante dorado (`DiamanteCargando`) al centro. Va
  `fixed` y no `absolute` para que el diamante quede centrado en el viewport
  aunque lo de atrás sea más alto que la pantalla.
- **La misma pantalla cubre las dos esperas del sistema**, a propósito, para que
  navegar y enviar se sientan igual:
  - **Navegación** — hay un `loading.tsx` en la raíz como red de contención, y
    otros en `(client)/`, `admin/(protected)/`, `catalogo/` y `producto/[slug]/`.
    Los dos últimos dibujan además un esqueleto atrás, así lo que se difumina es
    contenido real con la forma de la página que viene.
  - **Filtrar el catálogo** — cambiar solo un search param **no vuelve a mostrar
    el `loading.tsx`**. Por eso la grilla va en su propio `<Suspense>` con
    `key={categoria}`: sin la key React reutiliza el mismo límite y el fallback
    nunca reaparece. El overlay ahí va con `dentroDelContenedor`, acotado al
    área de la grilla, para no taparle los filtros al usuario justo después de
    que tocó uno.
  - **Envío de formularios** — `<BotonEnviar>` (`src/components/boton-enviar.tsx`)
    lee `useFormStatus` y muestra el overlay mientras corre la server action.
    Tiene que ir **dentro** del `<form>`, no envolviéndolo.
- **Un formulario público nuevo usa `BotonEnviar`, no `Button type="submit"`.**
  Además de la señal visual, deshabilita el botón mientras dura el envío: con
  fotos de varios MB la espera es de varios segundos, y sin eso un segundo
  submit crea la solicitud dos veces.
- **Revelado al scrollear: `<Revelar>`** (`src/components/revelar.tsx`), con
  `delay` para escalonar hermanos. Usa IntersectionObserver, se desconecta al
  revelar (que una sección se vuelva a esconder al salir de pantalla marea) y
  agrega la clase directo sobre el nodo, sin estado de React: es puramente
  visual y un re-render por sección mientras se scrollea es trabajo de más.
- El `@media (scripting: none)` de `globals.css` muestra lo que envuelve
  `<Revelar>` cuando no hay JavaScript. Sin eso quedaría invisible para siempre.

## Sobre nosotros

`src/app/(client)/sobre-nosotros/page.tsx` tiene **contenido de relleno**, no
real. Todo el texto está en constantes al principio del archivo, separadas por
un comentario: se reemplaza eso y no hace falta tocar el markup. Si el negocio
alguna vez quiere editarlo desde el panel, esas constantes son lo que habría que
mover a una tabla.

## Despliegue

Va en **Vercel** (`vercel.json`), sobre funciones serverless. Eso condiciona lo
que se puede escribir:

- **Nada de escribir en disco.** El filesystem es de solo lectura. Las fotos van
  a Cloudinary (`src/lib/cloudinary.ts`); el fallback a `public/uploads` es solo
  para desarrollo y `guardarImagen()` corta con un error explícito si en
  producción faltan las credenciales — antes eso era un `EROFS` crudo que no
  decía qué faltaba.
- **Ningún request puede pasar de 4,5 MB**, y el archivo de un formulario viaja
  dentro del body del server action. Por eso `MAX_SIZE_BYTES` está en 4 MB.
  Subirlo no sirve: el 413 lo devuelve Vercel antes de que Next mire el request.
  Para fotos más grandes hay que subirlas del navegador directo a Cloudinary.
- **Nada de estado en la memoria del proceso.** Hay varias instancias y ninguna
  ve la memoria de la otra: `checkRateLimit` cuenta por instancia, así que el
  límite efectivo es más flojo de lo que dice el número. Frena, pero no es exacto.
- **La URL pública sale de `siteUrl()`** (`src/lib/site-url.ts`), nunca de
  `process.env.SITE_URL` a mano: en Vercel el dominio recién se conoce después
  del primer despliegue, y el helper cae en `VERCEL_PROJECT_PRODUCTION_URL`.
- **Las migraciones corren solo en el build de producción**, no en el de las
  previews, porque las previews comparten la misma base.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run db:migrate    # prisma migrate dev
npm run db:seed
```

`postinstall` corre `prisma generate`: después de tocar `schema.prisma`, regenerar
antes de compilar.
