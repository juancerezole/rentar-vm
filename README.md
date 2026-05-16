# Rentar — Portal de alquileres de Villa María (DEMO)

Proyecto full-stack: React + Node.js con autenticación, roles y carga de propiedades para inmobiliarias.

## Stack

- **Backend**: Node.js + Express + PostgreSQL (via Drizzle ORM) + JWT + bcrypt + Zod
- **Frontend**: React + Vite + TailwindCSS + React Router
- **Servicios externos**: Cloudinary (uploads), Resend (emails)
- **Logging**: pino · **Tests**: Vitest + supertest

## Requisitos

- Node.js ≥ 22.5
- PostgreSQL 14+ corriendo localmente o accesible vía URL
- npm

## Configuración

Copiar los `.env.example` y completar las variables:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Mínimo necesario para arrancar el server:

- `DATABASE_URL` — connection string de Postgres
- `JWT_SECRET` — generar con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Variables opcionales (uploads de imágenes y emails de reset funcionan en modo degradado si faltan): ver [server/.env.example](server/.env.example).

## Cómo correrlo

### 1. Backend

```bash
cd server
npm install
npm run db:setup          # aplica migraciones + seed inicial (ciudad + barrios)
SEED_DATA=true npm run dev   # arranca con datos de prueba
```

El servidor escucha en `http://localhost:4000`. Al boot aplica migraciones automáticamente.

Scripts útiles:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca con `--watch` |
| `npm run db:push` | Push del schema a la DB sin generar migraciones |
| `npm run db:generate` | Genera SQL desde cambios en `schema.js` |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:studio` | UI web para inspeccionar la DB |
| `npm test` | Corre la suite con vitest |
| `npm run lint` | ESLint |

### 2. Frontend (en otra terminal)

```bash
cd client
npm install
npm run dev
```

El cliente arranca en `http://localhost:5173`. En desarrollo, Vite proxea `/api` → `localhost:4000`.

## Usuarios de prueba (sólo con `SEED_DATA=true`)

| Rol           | Email                     | Password   |
|---------------|---------------------------|------------|
| Admin         | admin@rentar.com.ar       | admin123   |
| Inmobiliaria  | inmo@rentar.com.ar        | inmo123    |
| Usuario       | user@rentar.com.ar        | user123    |

> Las contraseñas demo son débiles a propósito. **Nunca** corras este seed con `NODE_ENV=production`.

## Roles

- **admin** — gestiona usuarios, propiedades y banners destacados.
- **inmobiliaria** — carga, edita y elimina sus propias propiedades.
- **usuario** — navega el portal.

El sistema garantiza que siempre quede al menos un admin: no podés degradar ni eliminar al último admin, ni modificar tu propio rol.

## Endpoints principales

- `POST /api/auth/register` — registrar usuario
- `POST /api/auth/login` — login (devuelve JWT)
- `POST /api/auth/forgot-password` — solicita link de reset
- `POST /api/auth/reset-password` — usa el token del email
- `GET  /api/auth/me` — perfil actual
- `GET  /api/properties` — listado público con filtros + paginación (`?tipo=&barrio=&minPrecio=&maxPrecio=&ambientes=&garantia=&mascotas=&amoblado=&expensas=&page=&limit=`)
- `POST /api/properties/ai-search` — búsqueda guiada en lenguaje natural
- `GET  /api/properties/cheapest-by-barrio`
- `GET  /api/properties/:id` — detalle (incluye imágenes)
- `POST /api/properties` — crear (rol inmobiliaria/admin)
- `PUT  /api/properties/:id` — editar (dueño/admin)
- `DELETE /api/properties/:id` — eliminar (dueño/admin)
- `POST /api/properties/:id/images` — registrar URL de Cloudinary
- `DELETE /api/properties/:id/images/:imageId`
- `GET  /api/properties/mine/list` — propiedades del usuario logueado
- `GET  /api/barrios` · `GET /api/barrios/heatmap`
- `GET  /api/banners` · `GET /api/profesionales`
- `GET  /api/stats/summary` — counts + dólar blue + clima
- `GET  /api/admin/users` — listado (admin)
- `PUT  /api/admin/users/:id/rol` — cambiar rol (admin)
- `DELETE /api/admin/users/:id` — eliminar usuario (admin)
- `GET  /api/health` — healthcheck con ping real a la DB

## Estructura

```
RentarVM/
├── server/
│   ├── config.js          ← validación de env vars al boot
│   ├── index.js           ← bootstrap + migraciones + listen
│   ├── routes/            ← auth, properties, misc
│   ├── middleware/        ← auth (JWT), validate (Zod), error handler
│   ├── services/          ← cloudinary, email
│   ├── db/                ← schema, migrations, seed
│   └── test/              ← vitest + supertest
├── client/
│   └── src/
│       ├── api.js         ← axios + interceptor JWT
│       ├── context/       ← AuthContext, ThemeContext
│       ├── pages/         ← rutas top-level
│       └── components/    ← UI + features
└── docs/                  ← hoja de ruta y notas internas
```

## Deploy

El [render.yaml](render.yaml) define el servicio. En producción:

- `NODE_ENV=production` activa los chequeos estrictos de `JWT_SECRET`.
- `TRUST_PROXY=1` permite que `express-rate-limit` use la IP real del cliente.
- `CLIENT_ORIGIN` debe apuntar al dominio del frontend desplegado.
