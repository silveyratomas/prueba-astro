const CART_KEY = "tp_cart";

/* Obtener el carrito guardado */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

/* Guardar el carrito */
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/* Agregar un producto */
function addToCart(item) {
  const cart = getCart();
  const found = cart.find((i) => i.slug === item.slug);
  if (found) {
    found.qty += item.qty;
  } else {
    cart.push(item);
  }
  setCart(cart);
  alert("Producto agregado al carrito");
}

/* Vaciar carrito */
function clearCart() {
  localStorage.removeItem(CART_KEY);
}

/* Mostrar carrito en consola (debug) */
function debugCart() {
  console.log(getCart());
}

/* Exportar funciones al navegador */
window.tpCart = { getCart, setCart, addToCart, clearCart, debugCart };
