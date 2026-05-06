# Rentar — Portal de alquileres de Villa María (DEMO)

Proyecto demo full-stack: React + Node.js con autenticación, roles y carga de propiedades para inmobiliarias.

## Stack

- **Backend**: Node.js + Express + SQLite (`better-sqlite3`) + JWT + bcrypt
- **Frontend**: React + Vite + TailwindCSS + React Router

## Requisitos

- Node.js 18+
- npm

## Cómo correrlo

### 1. Backend

```bash
cd server
npm install
npm run dev
```

El servidor arranca en `http://localhost:4000`. La primera vez crea `database.sqlite` y carga datos de ejemplo (barrios, propiedades, usuarios).

### 2. Frontend (en otra terminal)

```bash
cd client
npm install
npm run dev
```

El cliente arranca en `http://localhost:5173`.

## Usuarios de prueba

| Rol           | Email                     | Password   |
|---------------|---------------------------|------------|
| Admin         | admin@rentar.com.ar       | admin123   |
| Inmobiliaria  | inmo@rentar.com.ar        | inmo123    |
| Usuario       | user@rentar.com.ar        | user123    |

## Roles

- **admin**: ve y gestiona todo (usuarios, propiedades, banners destacados).
- **inmobiliaria**: carga, edita y elimina sus propias propiedades.
- **usuario**: navega el portal, guarda favoritos.

## Endpoints principales

- `POST /api/auth/register` — registrar usuario
- `POST /api/auth/login` — login (devuelve JWT)
- `GET  /api/auth/me` — perfil actual
- `GET  /api/properties` — listado público con filtros (`?tipo=&barrio=&minPrecio=&maxPrecio=&ambientes=&garantia=&mascotas=&amoblado=&expensas=`)
- `GET  /api/properties/:id` — detalle
- `POST /api/properties` — crear (rol inmobiliaria/admin)
- `PUT  /api/properties/:id` — editar (dueño/admin)
- `DELETE /api/properties/:id` — eliminar (dueño/admin)
- `GET  /api/properties/mine/list` — propiedades del usuario logueado
- `GET  /api/stats/summary` — dólar blue + clima + conteo propiedades
- `GET  /api/barrios` — listado de barrios
- `GET  /api/admin/users` — listado de usuarios (admin)
