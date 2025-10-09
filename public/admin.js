// admin.js
// Helpers para páginas del panel: proteger rutas y acciones comunes

(() => {
  function toast(msg) {
    // reemplazá por tu snackbar/toast si tenés uno
    alert(msg);
  }

  async function requireSessionOrRedirect() {
    try {
      if (!window.tpAdminAuth?.isLogged()) {
        location.href = '/admin/login';
        return false;
      }
      // valida el token con el backend
      await window.tpAdminAuth.me();
      return true;
    } catch (e) {
      // token vencido/incorrecto
      window.tpAdminAuth?.logout?.();
      location.href = '/admin/login';
      return false;
    }
  }

  // handler para un form de producto si existe en la pagina
  async function wireProductForm(selector = '#productForm') {
    const form = document.querySelector(selector);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await requireSessionOrRedirect();
      if (!ok) return;

      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        title: (data.title || '').trim(),
        slug: (data.slug || '').trim(),
        price: Number(data.price || 0),
        description: (data.description || '').trim() || null,
        imageUrl: (data.imageUrl || '').trim() || null,
        storeSlug: (data.storeSlug || '').trim(), // ejemplo: "mi-tienda-demo"
      };

      if (!payload.title || !payload.slug || !payload.price || !payload.storeSlug) {
        toast('Completá título, slug, precio y tienda.');
        return;
      }

      try {
        const r = await window.tpAdminAuth.api('/products', {
          method: 'POST',
          body: payload,
        });
        toast('Producto creado ✔');
        // limpiá o actualizá UI
        console.log('Producto creado:', r?.product);
      } catch (err) {
        console.error(err);
        toast(`Error al crear el producto${err?.status ? ` (HTTP ${err.status})` : ''}`);
      }
    });
  }

  // Exponer helpers
  window.tpAdmin = { requireSessionOrRedirect, toast, wireProductForm };

  // Auto-protección: si la página marca data-protected en <body>, validar sesión
  document.addEventListener('DOMContentLoaded', async () => {
    const protectedFlag = document.body?.dataset?.protected === 'true';
    if (protectedFlag) await requireSessionOrRedirect();
  });
})();
