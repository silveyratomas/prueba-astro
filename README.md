

---


![Vista previa de la página](./public/imgs/fotoSitio.png)
![Vista previa de la página de admin](./public/imgs/PaginaAdmin.png)


---

# TuTienda – Astro + Express + Prisma + JWT

Catálogo e-commerce con frontend en **Astro**, API en **Express** con **Prisma ORM** y **JWT** para autenticación.
Incluye: productos, categorías jerárquicas, destacados, panel admin y fallback a datos locales.

---

## 🧱 Estructura

```
.
├─ astro.config.mjs
├─ package.json
├─ pnpm-lock.yaml
├─ package-lock.json
├─ README.md
├─ server.mjs
├─ tsconfig.json
├─ tailwind.config.mjs
├─ .gitignore
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
│     ├─ migration_lock.toml
│     ├─ 20250919045836_init_schema/
│     │  └─ migration.sql
│     └─ 20250930031935_add_category_slug/
│        └─ migration.sql
├─ public/
│  ├─ admin-auth.js
│  ├─ admin-products.js
│  ├─ admin.js
│  ├─ cart.js
│  ├─ user.js
│  ├─ hook-admin.js
│  ├─ favicon.svg
│  └─ imgs/
│     ├─ fotoSitio.png
│     ├─ PaginaAdmin.png
│     ├─ celu1.jpeg
│     ├─ infinix.jpeg
│     ├─ redmi15C.jpeg
│     └─ samsumgA06.jpeg
├─ server/
│  ├─ index.ts
│  ├─ db/
│  │  └─ prisma.ts
│  └─ routes/
│     ├─ auth.ts
│     ├─ products.ts
│     └─ categories.ts
├─ src/
│  ├─ config.ts
│  ├─ assets/
│  │  ├─ astro.svg
│  │  └─ background.svg
│  ├─ components/
│  │  └─ MobileTabBar.astro
│  ├─ data/
│  │  └─ products.ts
│  ├─ generated/
│  │  └─ prisma/  (cliente Prisma generado)
│  ├─ layouts/
│  │  ├─ Layout.astro
│  │  └─ AdminLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ listado_box.astro
│  │  ├─ listado_tablas.astro
│  │  ├─ comprar.astro
+│  │  ├─ producto/
│  │  │  └─ [slug].astro
│  │  ├─ cuenta/
│  │  │  ├─ ingresar.astro
│  │  │  ├─ perfil.astro
│  │  │  └─ registrar.astro
│  │  └─ admin/
│  │     ├─ index.astro
│  │     ├─ login.astro
│  │     ├─ categories.astro
│  │     └─ productos.astro
│  ├─ styles/
│  │  └─ global.css
│  └─ utils/
├─ .vscode/
│  ├─ launch.json
│  └─ extensions.json
```

---

## Requisitos

* Node 20+ (probado con 22.x)
* pnpm
* PostgreSQL (o la DB que configures en Prisma)

---

## Variables de entorno (`.env`)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/tu_tienda?schema=public"
JWT_SECRET="una-clave-segura"
API_PORT=8787
FRONT_ORIGIN="http://localhost:4321"
```

> `FRONT_ORIGIN` admite múltiples orígenes separados por coma.

---

## Instalación & DB

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

Seed crea:

* Store: `mi-tienda-demo`
* Usuarios demo:

  * ADMIN  → `silveyramattostomas@gmail.com` / `admin123`
  * OWNER  → `buleria.games@gmail.com` / `owner123`

---

## Correr proyecto

En **dos terminales**:

```bash
# API
pnpm api:watch
# Front
pnpm dev
```

* API: [http://localhost:8787/api/health](http://localhost:8787/api/health)
* Front: [http://localhost:4321](http://localhost:4321)

---

## Autenticación (admin)

`public/admin-auth.js` maneja:

* `tpAdminAuth.login(email, password)`
* `tpAdminAuth.me()`
* `tpAdminAuth.api(path, opts)` → agrega `Authorization: Bearer <token>`
* `tpAdminAuth.logout()`

### Test rápido (Thunder Client / Postman / curl)

```bash
# Login
curl -s http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buleria.games@gmail.com","password":"owner123"}'

# Guardar token y probar /me
TOKEN="...pegar_token..."
curl -s http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Endpoints principales

### Auth

* `POST /api/auth/login` → `{ token, user }`
* `GET  /api/auth/me`    → `{ user }` (JWT)

### Products

* `GET    /api/products?store=:storeSlug[&cat=:categorySlug]`
* `POST   /api/products` (JWT)
  body:

  ```json
  {
    "title":"Moto G15",
    "slug":"moto-g15",
    "price": 123456.78,
    "description":"...",
    "imageUrl":"https://...",
    "storeSlug":"mi-tienda-demo",
    "isFeatured": true,
    "categorySlugs": ["celulares","motorola"]
  }
  ```
* `PATCH  /api/products/:id`  (parcial; admite `isFeatured`)
* `DELETE /api/products/:id`

### Categories

* `GET   /api/categories?store=:storeSlug`
* `POST  /api/categories` (JWT)
  body:

  ```json
  { "storeSlug":"mi-tienda-demo", "name":"Celulares", "slug":"celulares", "parentId": null }
  ```
* `PATCH /api/categories/:id` (opcional)

---

## Modelo de datos (resumen)

* **Store** 1—N **Product**
* **Store** 1—N **Category** (jerárquica con `parentId`)
* **Product** N—N **Category** vía **ProductCategory**

`price` se guarda como `Decimal` (en Prisma se envía como **string** internamente para evitar problemas de coma/punto).

---

## Frontend público

* **Home**: “Destacados” por `isFeatured` (también respeta `featuredSlugs` de config si lo usás).
* **Listado (box / tablas)**: consume `/api/products?store=mi-tienda-demo` y **cae a mock** (`src/data/products.ts`) si la API falla.
* **Detalle /producto/[slug]**: trae datos desde API y muestra recomendados.

---

## Panel Admin

Ruta: `/admin/productos`

* Form: título, slug auto, precio normalizado (`1.234,56 → 1234.56`), imagen, descripción, **destacado**, categorías con **chips**.
* Categorías: buscador + **creación rápida** escribiendo `padre > hija > nieta` (si no existen, se crean antes de guardar el producto).
* Listado: miniatura, precio, fecha, **toggle** destacado, **editar**/**eliminar**.

> Si ves “**Falta storeSlug**” o “**Definí el slug de la tienda**”: comprobá que `storeSlugHidden` tenga valor (por defecto `mi-tienda-demo`) y que `admin-products.js` esté cargando.

---

## Comandos útiles

```bash
# Health
curl -s http://localhost:8787/api/health

# Listar productos de la tienda
curl -s "http://localhost:8787/api/products?store=mi-tienda-demo"

# Crear una categoría (JWT)
curl -s http://localhost:8787/api/categories \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"storeSlug":"mi-tienda-demo","name":"Celulares","slug":"celulares"}'
```

---

## Troubleshooting

### 1) `PathError path-to-regexp` (Express 5)

No uses `app.use('/api/*', ...)`. Cambiá por:

```ts
app.use('/api', (req,res)=> res.status(404).json({error:'not_found'}));
```

o bien quitá el catch-all.

### 2) CORS / Token no se envía

* Asegurate de correr **API** y **Front** y que `FRONT_ORIGIN` incluya tu origen.
* `admin-auth.js` ya manda `Authorization: Bearer <token>`.

### 3) Prisma Windows `EPERM rename ...query_engine...`

* Cerrá procesos de Node que bloqueen `node_modules`.
* Probá `pnpm prisma generate` con consola como admin o reiniciá el shell.
* Si persiste: `rm -rf node_modules` + `pnpm install`.

### 4) `isFeatured` no se guarda

* Confirmá que el body envía `isFeatured: true`.
* Revisa `POST /api/products` y `PATCH /api/products/:id` (consola de admin muestra el payload).
* Verificá en BD con Prisma Studio: `pnpm prisma studio`.

### 5) No aparecen categorías

* Llamar `GET /api/categories?store=mi-tienda-demo`.
* En admin, escribir `padre > hija` y guardar producto: se crean automáticamente si no existen.

---

## Calidad & Estilo

* Astro con HTML accesible (`loading="lazy"`, labels, live region).
* CSS simple y consistente; soporte para tema/colores desde `Layout`.
* Código tipado (TS) en server y páginas con validaciones mínimas.

---

## Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "api": "tsx server/index.ts",
    "api:watch": "nodemon --watch server --ext ts,js --exec \"pnpm api\"",
    "prisma:gen": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed"
  }
}
```

---

## Licencia

Proyecto educativo. Usar libremente con atribución.

---

## Créditos

* Autor: **Tomas A. Silveyra Mattos**
* Stack: Astro · Express · Prisma · JWT

