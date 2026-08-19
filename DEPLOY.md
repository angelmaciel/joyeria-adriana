# Despliegue en Render

## 1. Crear el servicio

En Render: **New → Web Service** → conectar el repo de GitHub.

Render detecta `render.yaml` automáticamente. Si lo configurás a mano:

- **Runtime:** Node
- **Build command:** `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start command:** `npm run start`

## 2. Variables de entorno

Cargar en **Environment** del servicio (nunca en el repo):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La misma connection string de Prisma Postgres que está en `.env` local |
| `AUTH_SECRET` | **Generar una nueva** (ver abajo) — no reusar la de desarrollo |
| `ENCRYPTION_KEY` | **Generar una nueva** — ⚠️ ver advertencia |
| `SITE_URL` | La URL pública final, ej. `https://joyeria-adriana.onrender.com` |
| `WHATSAPP_NUMBER` | El WhatsApp del negocio, formato E.164 sin `+` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | La cuenta de Gmail que envía (la misma de tu `.env`) |
| `SMTP_PASSWORD` | La contraseña de aplicación de esa cuenta |
| `SMTP_FROM` | `Joyería y Relojería Adriana <la-misma-cuenta-que-SMTP_USER>` |

> Gmail exige que `SMTP_FROM` use **la misma dirección** que `SMTP_USER`. Si no
> coinciden, reescribe el remitente o rechaza el envío.

Para generar claves nuevas:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ **`ENCRYPTION_KEY` cifra los teléfonos y emails de los clientes.** Si se cambia
> o se pierde después de que haya solicitudes cargadas, esos datos quedan
> irrecuperables. Definirla una vez y guardarla en un lugar seguro.

## 3. Después del primer despliegue

1. **`SITE_URL`**: al crear el servicio recién sabés la URL final. Cargarla y redesplegar.
   De esto depende que el link de la foto en el mensaje de WhatsApp le abra al negocio.
2. **Los datos ya están cargados.** La base de Prisma Postgres se sembró desde local
   (categorías, productos de ejemplo y servicios), y Render se
   conecta a esa misma base. No hace falta correr el seed — lo cual es importante
   porque **el plan free de Render no da acceso a consola**.
3. **Crear la cuenta de administración.** El seed la crea solo si `SEED_ADMIN_EMAIL`
   y `SEED_ADMIN_PASSWORD` están definidas en el entorno desde el que se corre.
   Nunca dejar esas variables cargadas en un entorno compartido después de usarlas.

## Pendiente: fotos

Las imágenes se guardan en `public/uploads/`, que **se borra en cada despliegue**.
Mientras sean fotos de prueba no importa. Antes de cargar el catálogo real, elegir una:

- **Disco persistente de Render** (plan pago): descomentar el bloque `disk` en
  `render.yaml`. Es la opción más simple — no requiere tocar código.
- **Cloudinary / Supabase Storage**: gratis, pero hay que reescribir
  `src/lib/uploads.ts`.

## Nota sobre el plan free

Los servicios free de Render se apagan tras ~15 minutos sin tráfico, y el
siguiente pedido tarda ~50 segundos en responder mientras arranca de nuevo.
Para un negocio de cara al público conviene el plan pago.
