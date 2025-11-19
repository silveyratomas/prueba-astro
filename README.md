# TuTienda — La Revolución del E-commerce SaaS

> **Stack de Alto Rendimiento:** Astro 5 + Express 5 + Prisma ORM + PostgreSQL + Tailwind CSS 4

![Lobby](./public/imgs/lobby.png)

---

## ¿Por qué este proyecto es diferente?

Bienvenido a la próxima generación de plataformas de comercio electrónico. **TuTienda** no es solo otro carrito de compras; es una solución **SaaS (Software as a Service)** diseñada para escalar, rendir y convertir.

Hemos fusionado lo mejor de dos mundos:
1.  **La velocidad inigualable de Astro:** Un frontend que entrega HTML puro, logrando puntuaciones de Lighthouse perfectas (100/100) y un SEO orgánico superior.
2.  **La robustez de Express & Prisma:** Un backend sólido, tipado y seguro que maneja la lógica de negocio compleja sin sudar.

**¿El resultado?** Una tienda que carga al instante, gestiona miles de productos y ofrece una experiencia de administración de clase mundial.

---

## 📸 Galería de Funcionalidades

### 🛍️ Experiencia de Compra Fluida
Desde la navegación hasta el checkout, todo está optimizado para la conversión.

| Home & Destacados | Detalle de Producto | Carrito Inteligente |
|-------------------|---------------------|---------------------|
| ![Lobby](./public/imgs/lobby.png) | ![Producto](./public/imgs/producto.png) | ![Carrito](./public/imgs/carrito.png) |

### ⚡ Panel de Administración Potente
Gestiona tu negocio con herramientas profesionales. Control total sobre productos, ventas y clientes.

| Dashboard General | Gestión de Productos | Base de Clientes |
|-------------------|----------------------|------------------|
| ![Admin](./public/imgs/admin.png) | ![Admin Productos](./public/imgs/admin%20productos.png) | ![Admin Clientes](./public/imgs/adminClientes.png) |

### 📱 Productos Demo (Soporte Multimedia)
El sistema soporta imágenes de alta calidad, optimizadas automáticamente.

| Samsung A06 | Redmi 15C | Infinix |
|-------------|-----------|---------|
| ![Samsung](./public/imgs/samsumgA06.jpeg) | ![Redmi](./public/imgs/redmi15C.jpeg) | ![Infinix](./public/imgs/infinix.jpeg) |

---

## Arquitectura & Tecnologías

Este proyecto es una masterclass de arquitectura moderna. Aquí te explicamos cómo funciona la magia:

### 1. Frontend: Astro 5 (Islands Architecture)
*   **¿Qué es?** Astro es el framework web para sitios orientados a contenido.
*   **¿Por qué lo usamos?** A diferencia de React o Next.js que envían mucho JavaScript al cliente, Astro envía **HTML estático por defecto**.
*   **Hidratación Parcial:** Solo los componentes interactivos (como el botón "Añadir al carrito") cargan JavaScript. El resto es estático. Esto garantiza una carga inicial instantánea.
*   **SSR (Server Side Rendering):** Las páginas de administración y checkout se renderizan en el servidor para seguridad y datos en tiempo real.

### 2. Backend: Express 5 (API RESTful)
*   **El Cerebro:** Una API separada y desacoplada que maneja toda la lógica de negocio.
*   **Seguridad:** Implementa autenticación JWT y validación estricta de datos.
*   **Control Total:** Rutas modulares (`/api/products`, `/api/orders`) que permiten escalar el backend independientemente del frontend.

### 3. Base de Datos: Prisma ORM + PostgreSQL
*   **Type-Safety:** Prisma conecta nuestra base de datos con TypeScript. Si cambias una columna en la DB, el código te avisa antes de compilar.
*   **Relaciones Complejas:** Manejamos modelos relacionales avanzados:
    *   `Store` 1—N `Product`
    *   `User` N—M `Store` (vía `StoreCustomer`)
    *   Categorías Jerárquicas (Árboles de categorías).

---

## 📂 Estructura del Proyecto (Mapa Completo)

```
.
├── prisma/                 # CEREBRO DE DATOS
│   ├── schema.prisma       # El plano arquitectónico de la DB
│   ├── seed.ts             # Semilla de datos (crea tiendas y usuarios demo)
│   └── migrations/         # Historial evolutivo de la base de datos
├── public/                 # ACTIVOS ESTÁTICOS
│   ├── imgs/               # Imágenes de productos y screenshots
│   ├── admin-auth.js       # Lógica de autenticación del panel admin
│   └── cart.js             # Lógica del carrito (Vanilla JS optimizado)
├── server/                 # MOTOR BACKEND (Express)
│   ├── index.ts            # Punto de entrada de la API
│   ├── db/prisma.ts        # Cliente de base de datos (Singleton)
│   └── routes/             # Endpoints de la API
│       ├── auth.ts         # Login Administrativo
│       ├── orders.ts       # Procesamiento de Ventas y Checkout
│       ├── products.ts     # Gestión de Catálogo
│       └── shop-auth.ts    # Autenticación de Clientes (Multi-tienda)
├── src/                    # 🎨 INTERFAZ FRONTEND (Astro)
│   ├── components/         # Bloques de construcción (UI)
│   ├── layouts/            # Plantillas maestras (Admin vs Público)
│   ├── pages/              # Rutas y Vistas
│   │   ├── index.astro     # Página de Inicio (Lobby)
│   │   ├── comprar.astro   # Checkout / Finalizar Compra
│   │   ├── producto/       # Vista de Detalle ([slug].astro)
│   │   ├── cuenta/         # Área de Cliente (Perfil, Historial)
│   │   └── admin/          # Panel de Control (Protegido)
│   │       ├── index.astro # Dashboard
│   │       ├── ventas.astro# Listado de Órdenes
│   │       └── ...
│   └── styles/             # Estilos Globales (Tailwind)
└── astro.config.mjs        # Configuración del Framework
```

---

## Instalación y Despegue

¿Listo para probarlo? Sigue estos pasos y tendrás tu propia tienda corriendo en minutos.

### 1. Preparativos
Necesitas **Node.js v20+** y **PostgreSQL**.

### 2. Instalación
```bash
# Clonar el repositorio
git clone <repo>
cd prueba-astro

# Instalar dependencias (usamos pnpm por velocidad)
pnpm install
```

### 3. Configuración (.env)
Crea un archivo `.env` en la raíz:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/tu_tienda"
JWT_SECRET="super-secret-key"
API_PORT=8787
FRONT_ORIGIN="http://localhost:4321"
```

### 4. Inicializar Base de Datos
```bash
# Generar cliente Prisma
pnpm prisma generate

# Crear tablas
pnpm prisma migrate dev

# Poblar con datos de prueba (Admin, Tienda Demo, Productos)
pnpm prisma db seed
```

### 5. run
```bash
pnpm dev
```
Esto iniciará tanto el **Frontend (Puerto 4321)** como el **Backend (Puerto 8787)** simultáneamente.

---

## API Reference (Para Desarrolladores)

Nuestra API es RESTful y fácil de consumir.

*   **`GET /api/products?store=mi-tienda-demo`**: Obtiene el catálogo completo. Soporta filtrado por categoría.
*   **`POST /api/orders`**: El corazón del checkout. Recibe el carrito, valida stock, calcula totales reales (backend-side) y genera la orden.
*   **`POST /api/auth/login`**: Autenticación segura para administradores.
*   **`POST /api/shop/login`**: Autenticación mágica para clientes. Usa "Composite Emails" (`tienda::email`) para que un usuario pueda tener cuentas separadas en diferentes tiendas del mismo sistema.

---

## Créditos

Desarrollado por **Tomas A. Silveyra Mattos**.
Este proyecto demuestra el poder de las arquitecturas monolíticas modernas para construir software escalable, mantenible y de alto rendimiento.

