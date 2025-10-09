// public/admin-categories.js
// public/admin-categories.js
// Renderizado de categorías en modo árbol y selección de padre (client-side)
(function () {
    // @ts-nocheck
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    async function __saveCat(ev) {
        ev.preventDefault();
        // crear requiere auth
        try {
            await tpAdminAuth.requireAuth();
        } catch (e) {
            return alert('Necesitás estar autenticado para crear categorías');
        }

        const f = ev.target;
        const body = {
            storeSlug: (f.storeSlug?.value || '').trim(),
            name: (f.name?.value || '').trim(),
            slug: (f.slug?.value || '').trim(),
            parentSlug: (f.parentSlug?.value || '').trim() || undefined,
            isOffer: !!(f.isOffer && (f.isOffer.checked || f.isOffer.value === 'on')),
        };
        if (!body.storeSlug || !body.name || !body.slug) return alert('Completá los campos obligatorios.');

        try {
            await tpAdminAuth.api('/categories', { method: 'POST', body });
            alert('Categoría creada');
            if (f && typeof f.reset === 'function') f.reset();
            const sf = document.getElementById('storeFilter'); if (sf) sf.value = body.storeSlug;
            await __loadList();
        } catch (e) {
            console.error(e);
            alert('Error al crear categoría');
        }
    }

    // Construye árbol anidado de categorías
    function buildTree(flat) {
        const byId = new Map();
        flat.forEach(c => byId.set(c.id, Object.assign({}, c, { children: [] })));
        const roots = [];
        for (const c of byId.values()) {
            if (c.parentId) {
                const parent = byId.get(c.parentId);
                if (parent) parent.children.push(c);
                else roots.push(c); // parent missing -> treat as root
            } else {
                roots.push(c);
            }
        }
        // sort children by name
        function sortRec(nodes) {
            nodes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            nodes.forEach(n => sortRec(n.children));
        }
        sortRec(roots);
        return roots;
    }

    function renderNode(cat) {
        const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
        const offerLabel = cat.isOffer ? ' <span class="text-amber-500">(OFERTA)</span>' : '';
        const summary = `
            <div class=\"flex items-center justify-between gap-3\"> 
                <div class=\"flex items-center gap-3\"> 
                    <button type=\"button\" class=\"text-left\" data-cat-select data-cat-slug=\"${cat.slug}\">\u2022 <strong>${escapeHtml(cat.name)}</strong> ${offerLabel} <span class=\"text-[var(--muted)]\">(${escapeHtml(cat.slug)})</span></button>
                </div>
                <div class=\"flex gap-2\"> 
                    <button class=\"btn-white text-xs\" onclick=\"window.adminCategories.edit('${cat.id}')\">Editar</button>
                    <button class=\"btn-outline text-xs\" onclick=\"window.adminCategories.remove('${cat.id}')\">Borrar</button>
                </div>
            </div>
        `;

        if (!hasChildren) return `<li>${summary}</li>`;

        const childrenHtml = cat.children.map(renderNode).join('');
        return `
            <li>
                <details class=\"bg-[var(--card)]/20 p-2 rounded\"> 
                    <summary>${summary}</summary>
                    <ul class=\"ml-4 mt-2 space-y-1\">${childrenHtml}</ul>
                </details>
            </li>
        `;
    }

    function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[ch])); }

    function clearSelectedMarker() {
        $$('[data-cat-selected]').forEach(el => el.removeAttribute('data-cat-selected'));
    }

    function wireSelectBehavior(container) {
        if (!container) return;
        container.addEventListener('click', (ev) => {
            const btn = ev.target.closest('[data-cat-select]');
            if (!btn) return;
            ev.preventDefault();
            const slug = btn.getAttribute('data-cat-slug');
            const input = document.getElementById('parentSlug');
            const sel = document.getElementById('selectedParent');
            if (input) input.value = slug || '';
            if (sel) sel.textContent = slug || 'ninguno';
            clearSelectedMarker();
            // mark the clicked button's parent li
            const li = btn.closest('li');
            if (li) li.setAttribute('data-cat-selected', '1');
        });
    }

    async function __loadList() {
        console.debug('[admin-categories] __loadList called');
        const storeEl = document.getElementById('storeFilter');
        const store = storeEl ? (storeEl.value || '').trim() : '';
        if (!store) return;

        const target = document.getElementById('catList');
        if (target) target.innerHTML = '<li class="text-[var(--muted)]">Cargando categorías…</li>';

        try {
            const res = await tpAdminAuth.api(`/categories?store=${encodeURIComponent(store)}`);
            const list = Array.isArray(res?.categories) ? res.categories : [];
            if (!list.length) {
                if (target) target.innerHTML = '<li class="text-[var(--muted)]">No hay categorías.</li>';
                return;
            }

            const tree = buildTree(list);
            const html = tree.map(renderNode).join('');
            if (target) target.innerHTML = html;
            // wire selection on the rendered list
            wireSelectBehavior(target);
        } catch (e) {
            console.error(e);
            if (target) target.innerHTML = '<li class="text-red-700">Error al listar.</li>';
        }
    }

    async function __editCat(id) {
        try {
            await tpAdminAuth.requireAuth();
            const name = prompt('Nuevo nombre de la categoría');
            if (name == null) return;
            await tpAdminAuth.api(`/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: { name } });
            await __loadList();
        } catch (e) { console.error(e); alert('Error al editar'); }
    }

    async function __removeCat(id) {
        if (!confirm('¿Borrar categoría? Esta acción no se puede deshacer.')) return;
        try {
            await tpAdminAuth.requireAuth();
            await tpAdminAuth.api(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
            await __loadList();
        } catch (e) { console.error(e); alert('Error al borrar'); }
    }

    function init() {
        const f = document.getElementById('catForm');
        if (f) f.addEventListener('submit', __saveCat);
        document.addEventListener('DOMContentLoaded', __loadList);
        window.__loadList = __loadList;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.adminCategories = { init, edit: __editCat, remove: __removeCat };
})();
