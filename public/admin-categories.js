// public/admin-categories.js
(function () {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));

    let editingId = null;

    // --- Utilidades ---
    function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[ch])); }

    const slugify = (s) =>
        (s || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

    function toast(msg, type = 'ok') {
        const el = document.createElement('div');
        el.className = 'fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-xl text-sm text-white shadow-lg z-50';
        el.style.background = type === 'err' ? '#c0392b' : '#16a085';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    async function __guard() {
        const m = await tpAdminAuth.me();
        if (!m?.user) location.href = '/admin/login';
        return m.user;
    }

    // --- Lógica del Árbol ---
    function buildTree(flat) {
        const byId = new Map();
        flat.forEach(c => byId.set(c.id, Object.assign({}, c, { children: [] })));
        const roots = [];
        for (const c of byId.values()) {
            if (c.parentId) {
                const parent = byId.get(c.parentId);
                if (parent) parent.children.push(c);
                else roots.push(c);
            } else {
                roots.push(c);
            }
        }
        function sortRec(nodes) {
            nodes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            nodes.forEach(n => sortRec(n.children));
        }
        sortRec(roots);
        return roots;
    }

    function renderNode(cat) {
        const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
        const offerLabel = cat.isOffer ? ' <span class="text-amber-500 text-xs font-bold ml-1">OFERTA</span>' : '';

        // Botones de acción
        const actions = `
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="text-xs px-2 py-1 rounded bg-[var(--surface)] border border-[var(--card-border)] hover:bg-gray-100" 
                    onclick="window.__editCat('${cat.id}', '${escapeHtml(cat.name)}', '${escapeHtml(cat.slug)}', '${cat.parentId || ''}', ${cat.isOffer})">
                    Editar
                </button>
                <button class="text-xs px-2 py-1 rounded bg-[var(--surface)] border border-[var(--card-border)] hover:text-red-600" 
                    onclick="window.__setParent('${cat.slug}')" title="Usar como padre para nueva categoría">
                    + Subcat
                </button>
            </div>
        `;

        const content = `
            <div class="group flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--card-border)]/20 transition-colors">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">${escapeHtml(cat.name)}</span>
                    <span class="text-xs text-[var(--muted)] font-mono">${escapeHtml(cat.slug)}</span>
                    ${offerLabel}
                </div>
                ${actions}
            </div>
        `;

        if (!hasChildren) return `<li class="pl-2 border-l border-[var(--card-border)] ml-2">${content}</li>`;

        const childrenHtml = cat.children.map(renderNode).join('');
        return `
            <li class="pl-2 border-l border-[var(--card-border)] ml-2">
                <details open>
                    <summary class="list-none cursor-pointer">
                        ${content}
                    </summary>
                    <ul class="mt-1 space-y-1">${childrenHtml}</ul>
                </details>
            </li>
        `;
    }

    async function __loadList() {
        const store = ($('#storeFilter')?.value || 'mi-tienda-demo').trim();
        const target = $('#catList');
        if (!target) return;

        target.innerHTML = '<li class="text-[var(--muted)]">Cargando...</li>';

        try {
            const res = await tpAdminAuth.api(`/categories?store=${encodeURIComponent(store)}`);
            const list = Array.isArray(res?.categories) ? res.categories : [];

            if (!list.length) {
                target.innerHTML = '<li class="text-[var(--muted)] p-4 text-center">No hay categorías creadas.</li>';
                return;
            }

            const tree = buildTree(list);
            target.innerHTML = tree.map(renderNode).join('');
        } catch (e) {
            console.error(e);
            target.innerHTML = '<li class="text-red-600">Error al cargar categorías.</li>';
        }
    }

    // --- Lógica del Formulario ---

    function __resetForm() {
        editingId = null;
        const f = $('#catForm');
        if (f) f.reset();

        // Restaurar valores por defecto
        const storeHidden = $('#storeSlugHidden');
        if (storeHidden) storeHidden.value = ($('#storeFilter')?.value || 'mi-tienda-demo');

        const title = $('#formTitle');
        if (title) title.textContent = 'Nueva categoría';

        const sub = $('#formSubtitle');
        if (sub) sub.textContent = 'Creá una categoría raíz o una subcategoría.';

        const btn = $('#submitBtn');
        if (btn) btn.textContent = 'Guardar';

        const del = $('#deleteContainer');
        if (del) del.classList.add('hidden');
    }

    function __editCat(id, name, slug, parentId, isOffer) {
        editingId = id;
        const idInput = $('#catId');
        if (idInput) idInput.value = id;

        const nameInput = $('[name="name"]');
        if (nameInput) nameInput.value = name;

        const slugInput = $('[name="slug"]');
        if (slugInput) slugInput.value = slug;

        const offerInput = $('[name="isOffer"]');
        if (offerInput) offerInput.checked = !!isOffer;

        const parentInput = $('[name="parentSlug"]');
        if (parentInput) parentInput.value = ''; // Reset parent slug on edit for simplicity

        const title = $('#formTitle');
        if (title) title.textContent = 'Editar categoría';

        const sub = $('#formSubtitle');
        if (sub) sub.textContent = `Editando: ${name}`;

        const btn = $('#submitBtn');
        if (btn) btn.textContent = 'Actualizar';

        const del = $('#deleteContainer');
        if (del) del.classList.remove('hidden');

        // Scroll al form
        const f = $('#catForm');
        if (f) f.scrollIntoView({ behavior: 'smooth' });
    }

    function __setParent(slug) {
        __resetForm();
        const parentInput = $('[name="parentSlug"]');
        if (parentInput) parentInput.value = slug;

        const sub = $('#formSubtitle');
        if (sub) sub.textContent = `Creando subcategoría de: ${slug}`;

        const f = $('#catForm');
        if (f) f.scrollIntoView({ behavior: 'smooth' });
    }

    async function __saveCat(ev) {
        ev.preventDefault();
        await __guard();

        const f = ev.target;
        const fd = new FormData(f);
        const storeSlug = fd.get('storeSlug');
        const name = fd.get('name');
        const slug = fd.get('slug');
        const parentSlug = fd.get('parentSlug');
        const isOffer = fd.get('isOffer') === 'on';

        if (!name || !slug) return toast('Nombre y Slug son obligatorios', 'err');

        const body = {
            storeSlug,
            name,
            slug,
            parentSlug: parentSlug || undefined,
            isOffer
        };

        try {
            if (editingId) {
                await tpAdminAuth.api(`/categories/${editingId}`, { method: 'PATCH', body });
                toast('Categoría actualizada');
            } else {
                await tpAdminAuth.api('/categories', { method: 'POST', body });
                toast('Categoría creada');
            }
            __resetForm();
            await __loadList();
        } catch (e) {
            console.error(e);
            toast('Error al guardar', 'err');
        }
    }

    async function __deleteCurrent() {
        if (!editingId) return;
        if (!confirm('¿Estás seguro de eliminar esta categoría? Si tiene hijos, podrían quedar huérfanos.')) return;

        try {
            await tpAdminAuth.api(`/categories/${editingId}`, { method: 'DELETE' });
            toast('Categoría eliminada');
            __resetForm();
            await __loadList();
        } catch (e) {
            console.error(e);
            toast('Error al eliminar', 'err');
        }
    }

    // --- Inicialización ---
    function init() {
        const f = $('#catForm');
        if (f) {
            f.addEventListener('submit', __saveCat);

            // Auto-slug
            const nameInput = $('[name="name"]');
            const slugInput = $('[name="slug"]');
            if (nameInput && slugInput) {
                nameInput.addEventListener('input', () => {
                    if (!editingId) slugInput.value = slugify(nameInput.value);
                });
            }
        }

        // Exponer globales
        window.__loadList = __loadList;
        window.__resetForm = __resetForm;
        window.__editCat = __editCat;
        window.__setParent = __setParent;
        window.__deleteCurrent = __deleteCurrent;

        __loadList();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
