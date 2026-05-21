# 🚀 TuTienda - Documentación del Proyecto

Este documento sirve como guion y explicación técnica de **TuTienda**, una plataforma SaaS (Software as a Service) de comercio electrónico diseñada para ser rápida, moderna y escalable.

---

## 1. ¿Qué es TuTienda?

**TuTienda** es una plataforma que permite a emprendedores crear y gestionar su propia tienda online en cuestión de minutos. A diferencia de los e-commerce tradicionales lentos y pesados, TuTienda utiliza una arquitectura moderna que separa el contenido estático (Frontend) de la lógica de negocio (Backend), garantizando una velocidad de carga instantánea para los clientes finales.

### Características Principales:
- **Panel de Administración:** Gestión completa de productos, categorías y órdenes.
- **Tienda Pública:** Catálogo de productos, carrito de compras y checkout optimizado.
- **SaaS Multi-tenant:** Preparado para alojar múltiples tiendas (identificadas por `storeSlug`).
- **Diseño Moderno:** Interfaz oscura (Dark Mode), minimalista y responsiva.

---

## 2. Tecnologías Utilizadas

El proyecto está construido sobre un stack tecnológico de última generación ("Bleeding Edge"):

### Frontend (La cara visible)
- **Astro 5:** Framework web principal. Se utiliza para generar HTML estático ultrarrápido. La filosofía es "Zero JS by default", enviando JavaScript solo cuando es estrictamente necesario.
- **Tailwind CSS 4:** Motor de estilos. Permite un diseño rápido y consistente mediante clases utilitarias. Se utiliza la configuración de Dark Mode y gradientes modernos.
- **Vanilla JavaScript:** Para la interactividad del lado del cliente (carrito de compras, formularios del admin) no usamos frameworks pesados como React o Vue, sino JavaScript nativo para máximo rendimiento.

### Backend (El cerebro)
- **Node.js + Express:** Servidor API RESTful que maneja la lógica de negocio.
- **Prisma ORM:** Capa de abstracción de base de datos. Permite interactuar con los datos usando TypeScript de forma segura y tipada.
- **PostgreSQL:** Base de datos relacional robusta donde se guarda toda la información (usuarios, productos, órdenes).
- **JWT (JSON Web Tokens):** Sistema de autenticación seguro y sin estado (stateless) para el panel de administración.

---

## 3. Arquitectura de APIs

El sistema funciona mediante una API REST interna que comunica el Frontend con la Base de Datos.

### Endpoints Principales:

#### 🔐 Autenticación (`/api/auth`)
- `POST /register`: Crea una nueva cuenta de administrador y su tienda asociada.
- `POST /login`: Autentica al administrador y devuelve un token JWT.
- `GET /me`: Verifica la sesión actual.

#### 📦 Productos (`/api/products`)
- `GET /`: Obtiene el listado de productos (público o admin). Soporta filtros por tienda y categoría.
- `POST /`: Crea un nuevo producto (requiere Auth).
- `PATCH /:id`: Actualiza precio, stock o estado de un producto.
- `DELETE /:id`: Elimina un producto (con validación de integridad referencial).

#### 📦 Órdenes (`/api/orders`)
- `POST /`: Crea una nueva orden de compra (Checkout público).
- `GET /`: Lista las órdenes de la tienda (requiere Auth).
- `PATCH /:id`: Actualiza el estado del pedido (ej. de "Pendiente" a "Enviado").

#### 📂 Categorías (`/api/categories`)
- Gestión de la estructura de árbol de las categorías de la tienda.

---

## 4. Flujo de Funcionamiento (Paso a Paso)

### A. El Administrador (Back-office)
1. **Registro:** El usuario llega a la Landing Page y hace clic en "Comenzar". Se registra creando su usuario y el nombre de su tienda (slug).
2. **Gestión:** Accede al **Panel de Admin**.
   - En la pestaña **Productos**, carga su inventario, define precios, sube imágenes y asigna categorías.
   - En la pestaña **Órdenes**, visualiza las ventas entrantes en tiempo real. Puede cambiar el estado de "Pago Pendiente" a "Pagado" y gestionar el envío.

### B. El Cliente (Front-office)
1. **Navegación:** El cliente entra a la tienda pública. Astro sirve el HTML pre-renderizado, por lo que la carga es instantánea.
2. **Compra:**
   - Agrega productos al carrito (gestionado en `localStorage` con JS).
   - Procede al Checkout, completa sus datos (nombre, dirección).
   - Al confirmar, el sistema envía un `POST` a la API, que guarda la orden en PostgreSQL y limpia el carrito.

### C. Ciclo de Vida de una Orden
1. **Creación:** La orden nace con estado `PENDING` (Pago pendiente) y envío `PENDING`.
2. **Procesamiento:** El administrador ve la orden. Si recibe el pago, actualiza el estado a `PAID`.
3. **Despacho:** El administrador prepara el paquete y cambia el estado de envío a `IN_TRANSIT`.
4. **Finalización:** Cuando el cliente recibe el producto, la orden pasa a `DELIVERED` y `FULFILLED`.

---

## 5. Estructura de Archivos Clave

- `src/pages/landing.astro`: Página de presentación (Marketing).
- `src/pages/admin/`: Todas las vistas del panel de control.
- `server/routes/`: Definición de los endpoints de la API.
- `prisma/schema.prisma`: Definición de la estructura de la base de datos.
- `public/admin-*.js`: Lógica del lado del cliente para el panel de administración (separada para mantener el orden).
