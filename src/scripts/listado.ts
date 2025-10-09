import { fmtARS, escapeHtml, qs, fetchJSON, debounce } from '../lib/ui';
import { buildTree } from '../lib/categories';
import type { Category } from '../lib/categories';

type Product = { id: string; slug: string; title: string; price: number | string; imageUrl?: string; description?: string; isFeatured?: boolean };

const cfgEl = qs('#list-config') as HTMLDivElement | null;
const API = cfgEl?.dataset?.api || '';
const store = cfgEl?.dataset?.store || '';

if (!API || !store) {
    console.warn('[listado] missing API/store');
}

function makeProductCard(p: Product): string {
    const img = escapeHtml(p.imageUrl || '/imgs/placeholder.png');
    const cartObj = JSON.stringify({ slug: p.slug, title: p.title, price: Number(p.price || 0), qty: 1, img: p.imageUrl || '' });
    return `
    <article class="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-sm p-4 flex flex-col hover:shadow-md transition" data-title="${escapeHtml((p.title || '').toLowerCase())}" data-desc="${escapeHtml((p.description || '').toLowerCase())}" data-price="${Number(p.price || 0)}" data-slug="${escapeHtml(p.slug)}" data-featured="${p.isFeatured ? '1' : '0'}">
      <div class="relative w-full overflow-hidden rounded-lg bg-[var(--surface)]" style="padding-top:56.25%;">
        <img src="${img}" alt="${escapeHtml(p.title || '')}" class="absolute inset-0 w-full h-full object-contain" loading="lazy" />
      </div>
      <h3 class="mt-3 text-lg font-semibold text-[var(--text)]">${escapeHtml(p.title || '')}</h3>
      <p class="text-[var(--muted)]">${fmtARS(Number(p.price || 0))}</p>
      <p class="text-sm text-[var(--muted)] mb-3 line-clamp-2">${escapeHtml(p.description || '—')}</p>
      <div class="mt-auto flex gap-2">
        <a class="inline-flex items-center rounded-lg bg-[var(--accent)] text-white px-4 py-2 hover:bg-[var(--accent)]/80 transition" href="/producto/${encodeURIComponent(p.slug)}?store=${encodeURIComponent(store)}">Ver</a>
        <button class="inline-flex items-center rounded-lg border border-[var(--card-border)] px-4 py-2 hover:bg-[var(--surface)] transition" onclick='tpCart.addToCart(${cartObj})'>Agregar</button>
      </div>
    </article>
  `.replace(/\n\s+/g, '');
}

function renderProducts(list: Product[]) {
    const cards = qs('#cards') as HTMLElement | null;
    const countEl = qs('#catCount') as HTMLElement | null;
    if (!cards) return;
    cards.innerHTML = list.map(makeProductCard).join('');
    if (countEl) countEl.textContent = `${list.length} productos`;
}

async function loadProducts(opts?: { catSlug?: string }) {
    const cards = qs('#cards') as HTMLElement | null;
    if (!cards) return;
    const url = opts?.catSlug ? `${API}/products?store=${encodeURIComponent(store)}&cat=${encodeURIComponent(opts.catSlug)}` : `${API}/products?store=${encodeURIComponent(store)}`;
    cards.innerHTML = `<div class="col-span-3 py-6 text-[var(--muted)]">Cargando productos…</div>`;
    try {
        const data = await fetchJSON<{ products: Product[] }>(url);
        const list = Array.isArray(data?.products) ? data.products : [];
        if (!list.length) {
            cards.innerHTML = `<p class="text-[var(--muted)]">No hay productos.</p>`;
            const countEl = qs('#catCount'); if (countEl) countEl.textContent = '0 productos';
            return;
        }
        renderProducts(list);
    } catch (e: any) {
        console.error(e);
        cards.innerHTML = `<p class="text-red-700">Error al cargar productos</p>`;
    }
}

function renderCategoryNode(cat: Category) {
    const badge = cat.isOffer ? '<span class="text-[var(--accent)] text-xs font-medium ml-2">OFERTA</span>' : '';
    const slug = escapeHtml(cat.slug);
    const name = escapeHtml(cat.name);
    return `
    <li>
      <div class="flex items-center gap-2 py-1 px-1 rounded hover:bg-[var(--surface)]">
        <button class="w-6 h-6 grid place-items-center rounded border text-[var(--muted)] transition" aria-expanded="false" aria-controls="cat-children-${slug}" data-toggle="${slug}">
          <svg class="w-3 h-3 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"></path></svg>
        </button>
        <button class="text-sm flex-1 text-left truncate" data-cat-slug="${slug}" data-cat-name="${name}"><span class="font-medium">${name}</span><span class="ml-2 text-[var(--muted)] text-xs">${slug}</span></button>
        ${badge}
      </div>
      <ul id="cat-children-${slug}" class="ml-6 space-y-0.5" hidden></ul>
    </li>
  `.replace(/\n\s+/g, '');
}

function renderTree(nodes: Category[]) {
    const treeRoot = qs('#catTree') as HTMLElement | null;
    if (!treeRoot) return;
    const html = `<ul class="space-y-0.5 text-sm">${nodes.map((n: any) => renderNodeHTML(n)).join('')}</ul>`;
    treeRoot.innerHTML = html;
}

function renderNodeHTML(n: any): string {
    // n is CategoryNode (with children)
    const base = renderCategoryNode(n as Category);
    if (!n.children || !n.children.length) return base;
    // inject children into the placeholder UL
    const childHtml = n.children.map((c: any) => renderNodeHTML(c)).join('');
    return base.replace(`<ul id="cat-children-${escapeHtml(n.slug)}" class="ml-6 space-y-0.5" hidden></ul>`, `<ul id="cat-children-${escapeHtml(n.slug)}" class="ml-6 space-y-0.5">${childHtml}</ul>`);
}

function wireTree(container: HTMLElement) {
    // delegate clicks for toggles and category clicks
    container.addEventListener('click', (ev) => {
        const toggle = (ev.target as HTMLElement).closest('[data-toggle]') as HTMLElement | null;
        if (toggle) {
            const slug = toggle.getAttribute('data-toggle')!;
            const children = container.querySelector(`#cat-children-${slug}`) as HTMLElement | null;
            if (!children) return;
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            const svg = toggle.querySelector('svg');
            if (svg) svg.classList.toggle('rotate-90', !expanded);
            children.hidden = expanded;
            toggle.textContent = '';
            const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newSvg.setAttribute('class', 'w-3 h-3 transition-transform');
            newSvg.setAttribute('viewBox', '0 0 20 20');
            newSvg.setAttribute('fill', 'currentColor');
            newSvg.innerHTML = '<path d="M7 5l6 5-6 5V5z"></path>';
            toggle.appendChild(newSvg);
            return;
        }
        const btn = (ev.target as HTMLElement).closest('[data-cat-slug]') as HTMLElement | null;
        if (!btn) return;
        const slug = btn.getAttribute('data-cat-slug')!;
        const name = btn.getAttribute('data-cat-name') || slug;
        // mark active
        Array.from(container.querySelectorAll('[data-cat-active]')).forEach((el) => el.removeAttribute('data-cat-active'));
        const li = btn.closest('li'); if (li) li.setAttribute('data-cat-active', '1');
        const titleEl = qs('#catTitle'); if (titleEl) titleEl.textContent = name;
        loadProducts({ catSlug: slug });
    });
}

async function init() {
    const treeRoot = qs('#catTree') as HTMLElement | null;
    if (!treeRoot) return;
    try {
        const data = await fetchJSON<{ categories: Category[] }>(`${API}/categories?store=${encodeURIComponent(store)}`);
        const list = Array.isArray(data?.categories) ? data.categories : [];
        const tree = buildTree(list);
        renderTree(tree as any);
        wireTree(treeRoot);
    } catch (e) {
        console.error(e);
        treeRoot.innerHTML = '<p class="text-red-700">Error al cargar categorías</p>';
    }
    // initial load
    loadProducts();
    // wire Ver todos
    const allBtn = qs('#catAllBtn') as HTMLButtonElement | null;
    if (allBtn) allBtn.addEventListener('click', () => { qs('#catTitle')!.textContent = 'Todos los productos'; loadProducts(); Array.from(qs('#catTree')!.querySelectorAll('[data-cat-active]') || []).forEach((el: any) => el.removeAttribute('data-cat-active')); });
    // search debounce
    const search = qs('#filter') as HTMLInputElement | null;
    if (search) {
        const fn = debounce(() => {
            const q = (search.value || '').trim().toLowerCase();
            const cards = Array.from((qs('#cards') as HTMLElement)?.children || []);
            let vis = 0;
            cards.forEach((c: any) => {
                const t = c.dataset.title + ' ' + c.dataset.desc;
                const matches = !q || t.includes(q);
                c.style.display = matches ? '' : 'none';
                if (matches) vis++;
            });
            const noRes = qs('#noResults'); if (noRes) noRes.classList.toggle('hidden', vis > 0);
        }, 200);
        search.addEventListener('input', fn);
    }
}

init();
