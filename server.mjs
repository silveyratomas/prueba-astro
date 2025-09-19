// server.mjs
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* =======================
   Helpers simples
======================= */
const peso = (n) => Number(n).toFixed(2);

/**
 * Obtiene o crea carrito por token.
 * - Si no viene token, crea uno y lo retorna (devolvemos token al front).
 * - Si viene token, lo busca (por Store y token).
 */
async function getOrCreateCart({ storeId, token, userId }) {
  if (token) {
    const cart = await db.cart.findFirst({
      where: { storeId, token },
      include: { items: true }
    });
    if (cart) return cart;
  }
  // crear token simple (demo)
  const newToken = token || `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return db.cart.create({
    data: { storeId, userId: userId || null, token: newToken },
    include: { items: true }
  });
}

/* =======================
   Endpoints
======================= */

/** Productos de una tienda */
app.get('/api/stores/:slug/products', async (req, res) => {
  try {
    const store = await db.store.findFirst({
      where: { slug: req.params.slug },
      select: {
        id: true,
        name: true,
        products: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, title: true, slug: true, price: true, imageUrl: true, isFeatured: true,
            variants: { select: { id: true, sku: true, name: true, price: true, stock: true } }
          }
        }
      }
    });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });
    res.json(store.products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

/** Obtener carrito por token (y store) */
app.get('/api/cart', async (req, res) => {
  const { storeSlug, token } = req.query;
  if (!storeSlug) return res.status(400).json({ error: 'storeSlug requerido' });
  try {
    const store = await db.store.findFirst({ where: { slug: String(storeSlug) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const cart = await getOrCreateCart({ storeId: store.id, token: token ? String(token) : undefined });
    res.json(cart);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

/** Agregar item al carrito */
app.post('/api/cart/items', async (req, res) => {
  const { storeSlug, token, userId, productId, qty = 1, variantId } = req.body;
  if (!storeSlug || !productId) return res.status(400).json({ error: 'storeSlug y productId requeridos' });

  try {
    const store = await db.store.findFirst({ where: { slug: storeSlug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const product = await db.product.findFirst({
      where: { id: productId, storeId: store.id },
      include: { variants: true }
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // precio (si hay variante, usa su precio)
    let price = product.price;
    let chosenVariant = null;
    if (variantId) {
      chosenVariant = product.variants.find(v => v.id === variantId);
      if (!chosenVariant) return res.status(400).json({ error: 'Variante inválida' });
      price = chosenVariant.price ?? product.price;
    }

    // buscar/crear carrito
    const cart = await getOrCreateCart({ storeId: store.id, token, userId });

    // ¿ya existe item del mismo productId y variantId?
    const existing = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null }
    });

    if (existing) {
      const updated = await db.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + Number(qty || 1) }
      });
      const fullCart = await db.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      return res.json({ cart: fullCart, token: cart.token, item: updated });
    }

    const created = await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        qty: Number(qty || 1),
        price: price,
        title: product.title,
        imgUrl: product.imageUrl || null,
        metaJson: chosenVariant ? { variant: { id: chosenVariant.id, name: chosenVariant.name, sku: chosenVariant.sku } } : {}
      }
    });

    const fullCart = await db.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    res.json({ cart: fullCart, token: cart.token, item: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

/** Checkout → Crea Order desde un carrito (y lo limpia) */
app.post('/api/orders/checkout', async (req, res) => {
  const { storeSlug, token, userId } = req.body;
  if (!storeSlug || !token) return res.status(400).json({ error: 'storeSlug y token requeridos' });

  try {
    const store = await db.store.findFirst({ where: { slug: storeSlug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const cart = await db.cart.findFirst({
      where: { storeId: store.id, token },
      include: { items: true }
    });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

    const subtotal = cart.items.reduce((a, it) => a + Number(it.price) * it.qty, 0);
    const discount = 0;
    const shipping = 0;
    const total = subtotal - discount + shipping;

    const order = await db.order.create({
      data: {
        storeId: store.id,
        userId: userId || null,
        status: 'PAID', // demo
        currency: 'ARS',
        subtotal: peso(subtotal),
        discount: peso(discount),
        shipping: peso(shipping),
        total: peso(total),
        items: {
          create: cart.items.map(it => ({
            productId: it.productId,
            variantId: it.variantId,
            titleSnapshot: it.title,
            qty: it.qty,
            price: it.price
          }))
        },
        payments: {
          create: {
            provider: 'demo',
            providerRef: `demo_${Date.now()}`,
            amount: peso(total),
            status: 'APPROVED',
            payloadJson: { demo: true }
          }
        }
      },
      include: { items: true, payments: true }
    });

    // “Vaciar” carrito (opcional: eliminar items)
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
// Iniciar con: node server.mjs
// Requiere Node 18+ (fetch nativo)