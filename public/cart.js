/* ===========================
   Carrito robusto (localStorage)
   =========================== */

const CART_KEY = 'tp_cart';

/** Lee del LS y migra/normaliza por si hay ítems viejos */
function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const normalized = raw.map(normalizeItem).filter(Boolean);
    // si cambió algo, persistimos migrado
    if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
      localStorage.setItem(CART_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

/** Persiste */
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/** Normaliza un ítem (tolerante a formas distintas) */
function normalizeItem(i) {
  if (!i) return null;
  const productId = i.productId ?? i.id ?? null;
  const slug      = (i.slug ?? i.sku ?? '').toString();
  const title     = (i.title ?? i.name ?? slug ?? 'Producto').toString() || 'Producto';
  const img       = i.img ?? i.image ?? i.image_url ?? null;
  const qtyRaw    = i.qty ?? i.quantity ?? 1;
  let qty         = parseInt(qtyRaw, 10);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;

  let price = i.price ?? i.unit_price ?? i.amount ?? 0;
  price = Number(price);
  if (!Number.isFinite(price) || price < 0) price = 0;

  return { productId, slug, title, price, qty, img };
}

/** Clave para ver si dos ítems son el mismo producto (preferimos productId) */
function itemKey(i) {
  return i.productId != null ? `id:${i.productId}` : `slug:${i.slug}`;
}

/** Agrega/mergea cantidades */
function addToCart(item) {
  const next = normalizeItem(item);
  if (!next) return;

  const cart = getCart();
  const key  = itemKey(next);
  const idx  = cart.findIndex(x => itemKey(x) === key);

  if (idx >= 0) {
    cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + next.qty);
    // si vienen datos mejorcitos, actualizamos
    if (next.title && next.title !== 'Producto') cart[idx].title = next.title;
    if (Number.isFinite(next.price) && next.price > 0) cart[idx].price = next.price;
    if (next.img && !cart[idx].img) cart[idx].img = next.img;
  } else {
    cart.push(next);
  }

  setCart(cart);
}

/** Vacía */
function clearCart() {
  localStorage.removeItem(CART_KEY);
}

/** Ayuda debug */
function debugCart() {
  console.log(getCart());
}

/* Exponer API al navegador */
window.tpCart = { getCart, setCart, addToCart, clearCart, debugCart };
