// Consolidated admin-products.js
// Contiene todo el JavaScript requerido por la vista /admin/productos.
// Debe cargarse después de /admin-auth.js (ambos con defer) para que tpAdminAuth esté disponible.

(function () {
  // debug: imprimir versión para confirmar carga del script (quitá esto luego)
  try { console.info('[admin-products] loaded at', new Date().toISOString()); } catch (e) { }
  // utilidades DOM
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // utilidades seguras para evitar errores si un elemento falta
  function safeSet(selector, prop, value) {
    const el = $(selector);
    if (!el) return;
    try { el[prop] = value; } catch (e) { /* noop */ }
  }


  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-xl text-sm text-white shadow-lg';
    el.style.background = type === 'err' ? '#c0392b' : '#16a085';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  function fmt(n) {
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n || 0));
    } catch {
      return n;
    }
  }

  const slugify = (s) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  function detectStoreSlug() {
    const cand = ['#storeFilter', '[name="storeSlug"]', '#storeSlugHidden'];
    for (const sel of cand) {
      const el = document.querySelector(sel);
      if (el?.value?.trim()) return el.value.trim();
    }
    return 'mi-tienda-demo';
  }

  async function __guard() {
    const m = await tpAdminAuth.me();
    if (!m?.user) location.href = '/admin/login';
    return m.user;
  }

  // estado
  let selectedCatSlugs = [];
  let pendingNewCatNames = [];
  let editingId = null;

  // Categorías (chips)
  function renderCatChips() {
    const wrap = $('#catChips');
    if (!wrap) return;
    wrap.innerHTML = selectedCatSlugs
      .map(
        (slug) => `
        <span class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--card-border)]/30">
          <span class="text-xs">${slug}</span>
          <button type="button" class="text-xs text-[var(--muted)] hover:text-red-600" onclick="__removeCat('${slug}')">✕</button>
        </span>
      `,
      )
      .join('');
  }

  function __removeCat(slug) {
    selectedCatSlugs = selectedCatSlugs.filter((s) => s !== slug);
    renderCatChips();
  }

  async function __catKeydown(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const v = ev.target.value.trim();
      if (!v) return false;
      const slug = slugify(v);
      if (!selectedCatSlugs.includes(slug)) selectedCatSlugs.push(slug);
      if (!pendingNewCatNames.find((n) => slugify(n) === slug)) pendingNewCatNames.push(v);
      ev.target.value = '';
      renderCatChips();
      return false;
    }
    return true;
  }

  async function __pickExistingCats() {
    try {
      await __guard();
      const store = detectStoreSlug();
      const res = await tpAdminAuth.api(`/categories?store=${encodeURIComponent(store)}`);
      const list = Array.isArray(res?.categories) ? res.categories : [];
      if (!list.length) {
        toast('No hay categorías existentes');
        return;
      }

      const names = list.map((c) => `${c.name} (${c.slug})`);
      const choice = prompt(`Elegí una categoría existente (pegá el slug):\n\n${names.join('\n')}\n\nSlug:`);
      const slug = (choice || '').trim();
      if (!slug) return;
      if (!selectedCatSlugs.includes(slug)) selectedCatSlugs.push(slug);
      renderCatChips();
    } catch (e) {
      console.error(e);
      toast('No se pudieron traer categorías', 'err');
    }
  }

  async function ensureCategoriesExist(storeSlug) {
    if (!pendingNewCatNames.length) return;
    const existRes = await tpAdminAuth.api(`/categories?store=${encodeURIComponent(storeSlug)}`);
    const exist = (existRes?.categories || []).map((c) => c.slug);
    const toCreate = pendingNewCatNames
      .map((name) => ({ name, slug: slugify(name) }))
      .filter((c) => !exist.includes(c.slug));

    for (const c of toCreate) {
      await tpAdminAuth.api('/categories', { method: 'POST', body: { storeSlug, name: c.name, slug: c.slug } });
    }
    pendingNewCatNames = [];
  }

  // Form crear/editar
  function fillForm(p) {
  editingId = p?.id || null;
  safeSet('#prodId', 'value', p?.id || '');
  safeSet('[name="title"]', 'value', p?.title || '');
  safeSet('[name="slug"]', 'value', p?.slug || '');
  safeSet('[name="price"]', 'value', p?.price ?? '');
  safeSet('[name="imageUrl"]', 'value', p?.imageUrl || '');
  safeSet('[name="description"]', 'value', p?.description || '');
  safeSet('[name="storeSlug"]', 'value', p?.store?.slug || detectStoreSlug() || 'mi-tienda-demo');
  safeSet('[name="isFeatured"]', 'checked', !!p?.isFeatured);

    selectedCatSlugs = (p?.categories || []).map((c) => c.slug) || [];
    renderCatChips();

  safeSet('#formTitle', 'textContent', editingId ? 'Editar producto' : 'Añadir producto');
  safeSet('#formSubtitle', 'textContent', editingId ? 'Modificá y guardá los cambios.' : 'Completá los campos y guardá.');
  safeSet('#submitBtn', 'textContent', editingId ? 'Actualizar' : 'Guardar');
  }

  function __resetForm() {
    editingId = null;
    const f = $('#prodForm'); if (f) try { f.reset(); } catch (e) { }
    selectedCatSlugs = [];
    pendingNewCatNames = [];
    renderCatChips();
    safeSet('#formTitle', 'textContent', 'Añadir producto');
    safeSet('#formSubtitle', 'textContent', 'Completá los campos y guardá.');
    safeSet('#submitBtn', 'textContent', 'Guardar');
    safeSet('#formStatus', 'textContent', '');
  }

  function normalizePriceInput(raw) {
    if (raw == null) return NaN;
    let s = raw.toString().trim();
    if (!s) return NaN;
    s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return isNaN(n) ? NaN : n;
  }

  async function __onSubmit(ev) {
    ev.preventDefault();
    await __guard();

    const storeSlug = detectStoreSlug();
    const hidden = document.getElementById('storeSlugHidden');
    if (hidden) hidden.value = storeSlug;

    const form = ev.target;
    const fd = new FormData(form);

    const title = (fd.get('title') || '').toString().trim();
    const slug = (fd.get('slug') || '').toString().trim();
    let rawPrice = (fd.get('price') || '').toString().trim();
    const price = normalizePriceInput(rawPrice);
    const description = (fd.get('description') || '').toString().trim() || null;
    const imageUrl = (fd.get('imageUrl') || '').toString().trim() || null;
    const isFeatured = fd.get('isFeatured') === 'on' || fd.get('isFeatured') === 'true';
    const categorySlugs = (typeof window.getSelectedCatSlugs === 'function') ? window.getSelectedCatSlugs() : (Array.isArray(window.selectedCatSlugs) ? window.selectedCatSlugs.slice() : selectedCatSlugs.slice());

    if (!title) {
      toast('Completá título', 'err');
      return false;
    }
    if (!slug) {
      toast('Completá slug', 'err');
      return false;
    }
    if (!storeSlug) {
      toast('Definí el slug de la tienda', 'err');
      return false;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast('Precio inválido', 'err');
      return false;
    }

    const body = { title, slug, price, description, imageUrl, storeSlug, isFeatured, categorySlugs };
    console.log('[admin] payload /products', body);

    try {
      if (pendingNewCatNames.length) {
        try {
          await ensureCategoriesExist(storeSlug);
        } catch (e) {
          console.warn('ensureCategoriesExist fallo', e);
        }
      }

      if (editingId) {
        await tpAdminAuth.api(`/products/${editingId}`, { method: 'PATCH', body });
        toast('Producto actualizado');
      } else {
        await tpAdminAuth.api('/products', { method: 'POST', body });
        toast('Producto creado');
      }

      if (typeof __loadList === 'function') await __loadList();
      __resetForm();
    } catch (e) {
      console.error(e);
      toast(e?.message || 'Error al guardar', 'err');
    }

    return false;
  }

  // Listado + acciones
  async function __loadList() {
    await __guard();
    const store = ($('#storeFilter')?.value || detectStoreSlug() || '').trim();
    const rows = $('#prodRows');
    if (!store) {
      rows.innerHTML = `<tr><td colspan="7" class="py-4 text-[var(--muted)]">Definí el <b>slug</b> de la tienda.</td></tr>`;
      return;
    }
    try {
      rows.innerHTML = `<tr><td colspan="7" class="py-4 text-[var(--muted)]">Cargando…</td></tr>`;
      const res = await tpAdminAuth.api(`/products?store=${encodeURIComponent(store)}`);
      const list = Array.isArray(res?.products) ? res.products : [];
      if (!list.length) {
        rows.innerHTML = `<tr><td colspan="7" class="py-4 text-[var(--muted)]">No hay productos.</td></tr>`;
        return;
      }

      rows.innerHTML = list
        .map((p) => {
          const created = p.createdAt ? new Date(p.createdAt).toLocaleString('es-AR') : '-';
          const feat = !!p.isFeatured;
          return `
            <tr class="border-b border-[var(--card-border)] hover:bg-[var(--card-border)]/10">
              <td class="py-2 pr-3">${p.imageUrl ? `<img src="${p.imageUrl}" class="w-8 h-8 object-cover rounded-md"/>` : ''}</td>
              <td class="py-2 pr-3">${p.title || '-'}</td>
              <td class="py-2 pr-3 text-[var(--muted)]">${p.slug}</td>
              <td class="py-2 pr-3 text-right">${fmt(p.price)}</td>
              <td class="py-2 pr-3 text-[var(--muted)]">${created}</td>
              <td class="py-2 pr-3 text-center">
                <button class="text-xs px-2 py-1 rounded-md ${feat ? 'bg-emerald-600 text-white' : 'bg-[var(--card-border)]/50'}" onclick="__toggleFeatured('${p.id}', ${feat})">${feat ? 'Sí' : 'No'}</button>
              </td>
              <td class="py-2 pr-1">
                <div class="flex items-center gap-2 justify-end">
                  <button class="btn-outline text-xs" onclick='__edit(${JSON.stringify(p)})'>Editar</button>
                  <button class="text-xs px-3 py-1 rounded-md bg-red-600 text-white" onclick="__remove('${p.id}')">Eliminar</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    } catch (e) {
      console.error(e);
      rows.innerHTML = `<tr><td colspan="7" class="py-4 text-red-700">Error al listar.</td></tr>`;
    }
  }

  function __edit(p) {
    if (Array.isArray(p.categories)) {
      selectedCatSlugs = p.categories.map((c) => c.slug);
    } else {
      selectedCatSlugs = [];
    }
    renderCatChips();
    fillForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function __remove(id) {
    await __guard();
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await tpAdminAuth.api(`/products/${id}`, { method: 'DELETE' });
      toast('Producto eliminado');
      await __loadList();
    } catch (e) {
      console.error(e);
      toast('No se pudo eliminar', 'err');
    }
  }

  async function __toggleFeatured(id, current) {
    await __guard();
    try {
      await tpAdminAuth.api(`/products/${id}`, { method: 'PATCH', body: { isFeatured: !current } });
      await __loadList();
    } catch (e) {
      console.error(e);
      toast('No se pudo cambiar destacado', 'err');
    }
  }

  // Exponer funciones globales usadas por el HTML
  window.__loadList = __loadList;
  window.__edit = __edit;
  window.__remove = __remove;
  window.__toggleFeatured = __toggleFeatured;
  window.__resetForm = __resetForm;
  window.__catKeydown = __catKeydown;
  window.__pickExistingCats = __pickExistingCats;
  window.__removeCat = __removeCat;
  window.ensureCategoriesExist = ensureCategoriesExist;
  window.getSelectedCatSlugs = () => selectedCatSlugs.slice();

  // Hookear formulario y comportamiento al DOM
  function init() {
    const f = document.getElementById('prodForm');
    if (f) {
      f.removeEventListener('submit', __onSubmit);
      f.addEventListener('submit', __onSubmit);
    }

    // Autogenerar slug al tipear título
    const titleInput = $('[name="title"]');
    const slugInput = $('[name="slug"]');
    if (titleInput && slugInput) {
      let manualSlug = false;
      slugInput.addEventListener('input', () => (manualSlug = true));
      titleInput.addEventListener('input', () => {
        if (!manualSlug || !slugInput.value) slugInput.value = slugify(titleInput.value);
      });
    }

    // Carga inicial
    __loadList().catch(() => { });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // debug export
  window.adminProducts = { init, detectStoreSlug };
})();
