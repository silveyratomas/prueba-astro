

---

# **TuTienda - E-Commerce Proyecto**

## 🚀 Descripción del Proyecto

**TuTienda** es una plataforma de comercio electrónico en desarrollo, que ofrece una experiencia de compra fluida y optimizada, permitiendo a los usuarios explorar, seleccionar y comprar productos de manera sencilla.

Este proyecto está basado en **Astro** para la creación de sitios estáticos y **Tailwind CSS** para los estilos. El enfoque de diseño está pensado para ser lo más profesional y limpio posible, con una interfaz adaptativa que se ajusta a dispositivos móviles, tablets y escritorios.

---

## 🛠 Estructura del Proyecto

Dentro del proyecto de **TuTienda**, verás las siguientes carpetas y archivos:

```text
/
├── public/
│   └── imgs/
│       └── logo.png
├── src
│   ├── data/
│   │   └── products.ts
│   ├── components/
│   │   └── Header.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages
│       ├── index.astro
│       ├── listado_box.astro
│       ├── listado_tablas.astro
│       └── comprar.astro
└── package.json
```

Para aprender más sobre la estructura de carpetas de un proyecto **Astro**, consulta [la guía oficial](https://astro.build/en/basics/project-structure/).

---

## 🧞 Comandos

Todos los comandos deben ejecutarse desde la raíz del proyecto, en la terminal:

| Comando                | Acción                                                     |
| :--------------------- | :--------------------------------------------------------- |
| `pnpm install`         | Instala las dependencias                                   |
| `pnpm dev`             | Inicia el servidor de desarrollo en `localhost:4321`       |
| `pnpm build`           | Construye el sitio de producción en `./dist/`              |
| `pnpm preview`         | Previsualiza la construcción localmente antes de desplegar |
| `pnpm astro ...`       | Ejecuta comandos de la CLI como `astro add`, `astro check` |
| `pnpm astro -- --help` | Obtén ayuda sobre cómo usar la CLI de Astro                |

---

## 🧑‍💻 Cómo Empezar

Para comenzar a trabajar con **TuTienda** en tu máquina local, sigue estos pasos:

1. **Clona el repositorio:**

```sh
git clone https://github.com/tuusuario/tutienda.git
cd tutienda
```

2. **Instala las dependencias:**

```sh
pnpm install
```

3. **Inicia el servidor de desarrollo:**

```sh
pnpm dev
```

4. **Accede a la aplicación en tu navegador:**

* Abre **[http://localhost:4321](http://localhost:4321)** para ver el proyecto en acción.

---

## 🎯 Funcionalidades Actuales

### 1. Página de Inicio:

* **Bienvenida dinámica:** Muestra una bienvenida atractiva.
* **Navegación rápida:** Menú de navegación accesible para acceder a distintas secciones como el catálogo de productos, el listado en formato tabla y el proceso de compra.

### 2. Página de Productos:

* **Listado en tarjetas:** Los productos se muestran en tarjetas con nombre, precio, imagen y una breve descripción.
* **Búsqueda y filtro:** Los usuarios pueden buscar productos o verlos filtrados por categorías.

### 3. Carrito de Compras:

* **Interacción en tiempo real:** Los usuarios pueden agregar productos al carrito y ver el resumen sin recargar la página.
* **Total y cantidad:** El carrito muestra el total de la compra y la cantidad de productos.

### 4. Confirmación de Compra:

* **Formulario sencillo:** Los usuarios pueden llenar un formulario con sus datos y medios de pago para finalizar la compra.
* **Resumen del carrito:** Los usuarios pueden revisar el carrito antes de confirmar la compra.

---

## 📈 Futuro del Proyecto

**TuTienda** sigue en desarrollo y las siguientes características serán implementadas próximamente:

### 1. Gestión de Usuarios:

* **Registro y login:** Los usuarios podrán crear cuentas, iniciar sesión y gestionar sus datos personales.
* **Historial de compras:** Los usuarios podrán ver su historial de compras.

### 2. Integración de Pago:

* **Pasarelas de pago:** Se integrarán opciones como **Mercado Pago** o **Stripe** para procesar pagos de manera segura.

### 3. Administración del Inventario:

* **Panel de administración:** Los administradores podrán gestionar productos, precios, stock y categorías de manera sencilla a través de un panel de administración.

---

## 📜 Licencia

Este proyecto está bajo la **MIT License**. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

¡Gracias por ser parte de **TuTienda**!

---


