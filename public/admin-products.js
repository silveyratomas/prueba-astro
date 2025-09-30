/* public/admin-products.js */
(() => {
  const $  = (sel, root = document) => root.querySelector(sel);

  // Tomar slug de tienda desde varios posibles inputs (coincide con productos.astro)
  function getStoreSlug() {
    const candidates = [
      '#storeFilter',
      '[name="storeSlug"]',
      '#storeSlug',
      '[name="store"]',
      '#store',
    ];
    for (const sel of candidates) {
      const el = $(sel);
      if (el && typeof el.value === 'string' && el.value.trim()) return el.value.trim();
    }
    return '';
  }

  function fmtARS(n) {
    try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n || 0)); }
    catch { return String(n); }
  }

  async function loadProducts() {
    try {
      await tpAdminAuth.requireAuth();

      const slug = getStoreSlug();
      const tbody = $('#prodRows');
      if (!tbody) return;

      if (!slug) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-3 text-[var(--muted)]">
          Configurá el <strong>slug</strong> de la tienda (campo “Tienda (slug)” o el filtro de arriba).</td></tr>`;
        return;
      }

      const res  = await tpAdminAuth.api(`/products?store=${encodeURIComponent(slug)}`);
      const list = Array.isArray(res?.products) ? res.products : [];

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-3 text-[var(--muted)]">No hay productos.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(p => `
        <tr class="border-b border-[var(--card-border)]">
          <td class="py-2 pr-3">${p.title}</td>
          <td class="py-2 pr-3">${p.slug}</td>
          <td class="py-2 pr-3">${fmtARS(p.price)}</td>
          <td class="py-2 pr-3">${p.createdAt ? new Date(p.createdAt).toLocaleString('es-AR') : '-'}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('[admin] loadProducts', e);
      alert(e?.message || 'No se pudo cargar la lista de productos');
    }
  }

  // Puede recibir el event del submit o el form directo
  async function saveProduct(eOrForm) {
    try {
      await tpAdminAuth.requireAuth();

      let form;
      if (eOrForm && typeof eOrForm.preventDefault === 'function') {
        eOrForm.preventDefault();
        form = eOrForm.target;
      } else {
        form = eOrForm;
      }
      if (!form) return false;

      const data = Object.fromEntries(new FormData(form).entries());
      const body = {
        title: (data.title || '').trim(),
        slug: (data.slug || '').trim(),
        price: Number(data.price || 0),
        imageUrl: (data.imageUrl || '').trim() || null,
        description: (data.description || '').trim() || null,
        storeSlug: (data.storeSlug || '').trim() || getStoreSlug(),
        isFeatured: !!data.isFeatured,
      };

      if (!body.title || !body.slug || !body.storeSlug) {
        alert('Completá título, slug y tienda (slug).');
        return false;
      }

      await tpAdminAuth.api('/products', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      alert('Producto creado.');
      // reset, pero conservando el storeSlug
      const keepStore = body.storeSlug;
      form.reset();
      const storeInput = form.querySelector('[name="storeSlug"]') || $('#storeFilter');
      if (storeInput) storeInput.value = keepStore;

      await loadProducts();
      return false;
    } catch (e) {
      console.error('[admin] saveProduct', e);
      alert(e?.message || 'No se pudo guardar el producto');
      return false;
    }
  }

  // Exponer helpers globales por si los llama el HTML
  window.__loadProducts = loadProducts;
  window.__saveProduct  = saveProduct;

  document.addEventListener('DOMContentLoaded', () => {
    // Autovincular si existen
    const form = document.getElementById('prodForm');
    if (form) form.addEventListener('submit', saveProduct);

    const btnRefresh = document.getElementById('btnRefreshProducts');
    if (btnRefresh) btnRefresh.addEventListener('click', loadProducts);

    // Primera carga
    loadProducts();
  });
})();
