# Despliegue

El despliegue actual es **Vercel**. Al final queda la configuración de Render,
que sigue siendo válida por si hay que volver.

## 1. Crear el proyecto en Vercel

Cada carpeta de `portafolios/` es su propio repositorio git, así que en Vercel
esto es **un proyecto por repo**, no un monorepo: **Add New → Project** →
importar el repo de `joyeria-web`. El *Root Directory* queda en la raíz.

Vercel detecta Next.js solo. Lo que no adivina lo fija [vercel.json](vercel.json):

- **Región `iad1`** (Virginia). La base de Prisma Postgres está en `us-east-1` y
  cada página hace varias consultas: desde otra región cada una paga el cruce.
  Si movés la base, mové también esto.
- **Build command:** `if [ "$VERCEL_ENV" = "production" ]; then npx prisma migrate deploy; fi && npx next build`
- `prisma generate` no está ahí porque ya lo corre el `postinstall`.

> **Las migraciones corren solo en producción, a propósito.** Vercel ejecuta el
> mismo build en cada preview, y las previews comparten el `DATABASE_URL` que le
> cargues. Sin ese `if`, abrir una rama con una migración destructiva la aplicaría
> sobre la base real antes de que la mires. El costo es que una preview de una
> rama con migraciones nuevas ve el esquema viejo: si necesitás probarla de
> verdad, cargale a *Preview* un `DATABASE_URL` de una base aparte.

## 2. Variables de entorno

En **Settings → Environment Variables**. Salvo que quieras previews con base
propia, cargalas en los tres entornos (Production, Preview, Development).

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La connection string de Prisma Postgres, igual que en tu `.env` |
| `AUTH_SECRET` | **Generar una nueva** — no reusar la de desarrollo |
| `ENCRYPTION_KEY` | La **misma** que ya está en uso — ⚠️ ver advertencia |
| `SITE_URL` | El dominio público final. Se puede dejar sin cargar al principio |
| `WHATSAPP_NUMBER` | El WhatsApp del negocio, formato E.164 sin `+` |
| `CLOUDINARY_CLOUD_NAME` | Del Dashboard de Cloudinary |
| `CLOUDINARY_API_KEY` | Ídem |
| `CLOUDINARY_API_SECRET` | Ídem |
| `RESEND_API_KEY` | Para el mail de recuperación de contraseña |
| `RESEND_FROM` | `onboarding@resend.dev` hasta que haya dominio verificado |

No hacen falta en Vercel:

- **`AUTH_URL`** — Auth.js deduce la URL pública cuando detecta el entorno de Vercel.
- **`SITE_URL`, al principio** — [src/lib/site-url.ts](src/lib/site-url.ts) cae en
  `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel inyecta solo. Cargala igual cuando
  tengas dominio propio: esa variable siempre apunta al `.vercel.app`.
- **`SMTP_*`** — con `RESEND_API_KEY` cargada, el SMTP ni se mira.
- **`NODE_VERSION`** — la fija `engines.node` en `package.json`.

Para generar claves nuevas:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ **`ENCRYPTION_KEY` cifra los teléfonos y emails de los clientes.** Si el
> entorno de Vercel no tiene exactamente la misma clave que ya cifró los datos,
> el panel muestra `ILEGIBLE` y las búsquedas por teléfono y email dejan de
> encontrar nada, en silencio. No se genera una nueva para Vercel: se copia la
> que ya está en uso.

### Sobre `DATABASE_URL` y el pooling

Cada función de Vercel es un proceso aparte y abre su propia conexión, así que sin
un pooler delante unas pocas visitas simultáneas agotan el límite de Postgres y las
páginas empiezan a tirar `too many connections`.

Acá **no hay nada que hacer**: la base es Prisma Postgres y la connection string
apunta a `db.prisma.io`, que ya es el endpoint administrado con pooling. Se copia
tal cual está en el `.env`.

Si algún día se migra a una base propia, ahí sí hay que usar la URL *pooled* del
proveedor (en Neon la que dice `-pooler`, en Supabase la del puerto `6543`) o, si
solo hay una directa, agregarle `?connection_limit=1`.

## 3. Después del primer despliegue

1. **Cargar `SITE_URL`** con la URL final y redesplegar. Hasta entonces los links
   apuntan al dominio `.vercel.app`, que funciona pero no es el definitivo.
2. **Verificar la clave de cifrado:** `npm run check:key` desde local, con el
   `DATABASE_URL` de producción en el entorno. Sale con código 1 si encuentra
   datos cifrados con otra clave.
3. **Los datos ya están cargados.** La base se sembró desde local y Vercel se
   conecta a esa misma base: no hace falta correr el seed.
4. **La cuenta de administración ya existe** (hay un `AdminUser` en la base), así
   que se entra a `/admin/login` con las credenciales de siempre. Si alguna vez hay
   que crear otra: el seed la crea solo si `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`
   están definidas en el entorno desde el que se corre — o sea, desde tu máquina
   apuntando a esta base. Nunca dejarlas cargadas en las variables de Vercel.

## 4. Límites conocidos de Vercel

- **Las fotos no pueden pasar de 4 MB.** Vercel corta todo request a una función
  en 4,5 MB antes de que Next lo mire, y el archivo viaja dentro del body del
  server action. Por eso `MAX_SIZE_BYTES` en
  [src/lib/uploads.ts](src/lib/uploads.ts) está en 4 MB y `bodySizeLimit` en
  `4.5mb`. Subir esos números no alcanza: el 413 lo devuelve Vercel, no la app.
  Para aceptar fotos más grandes hay que subirlas del navegador **directo a
  Cloudinary** con una firma que genere el servidor, y mandarle al server action
  solo la URL. Queda pendiente para cuando entre el catálogo real.
- **El rate limit es por instancia.** [src/lib/rate-limit.ts](src/lib/rate-limit.ts)
  cuenta en memoria; en Render, con un proceso único, eso es exacto. En Vercel hay
  varias instancias, así que el límite efectivo de intentos de login se multiplica
  por cuantas haya vivas. Sigue frenando la fuerza bruta desde una IP, pero más
  flojo. Para que sea exacto habría que contar en la base o en un KV.
- **La barra de herramientas de las previews no carga.** La CSP de
  [next.config.ts](next.config.ts) tiene `script-src 'self'` y `frame-ancestors 'none'`,
  y el toolbar de Vercel se inyecta desde `vercel.live`. La app anda igual; si
  molesta, se desactiva en Settings → Toolbar, sin tocar la CSP.

---

## Anexo: despliegue en Render

[render.yaml](render.yaml) sigue en el repo y sigue siendo válido. Vercel lo ignora.

- **Runtime:** Node · **Build:** `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build` · **Start:** `npm run start`
- Las variables son las mismas de la tabla de arriba, más `AUTH_URL` (Render no la
  deduce) y `SITE_URL`, que ahí sí es obligatoria.
- **Render bloquea el SMTP saliente** en el plan gratuito: la conexión al 587 no
  falla, se cuelga hasta el timeout y el correo nunca sale. Por eso `RESEND_API_KEY`.
- **Los servicios free se apagan** tras ~15 minutos sin tráfico, y el siguiente
  pedido tarda ~50 segundos mientras arranca. Es la razón principal para haber
  pasado a Vercel.
- Ahí el límite de 4,5 MB no aplica: se puede subir `MAX_SIZE_BYTES` de vuelta.
