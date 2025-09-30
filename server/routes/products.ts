import { Router } from 'express';
import { prisma } from '../db/prisma';           // ✅ singleton
import { requireAuth } from './auth';            // o '../routes/auth' según tu estructura

export const productsRouter = Router();

/**
 * GET /api/products?store=mi-tienda-demo
 * Lista productos de una tienda por slug
 */
productsRouter.get('/', async (req, res) => {
  try {
    const storeSlug = String(req.query.store || '').trim();
    if (!storeSlug) return res.status(400).json({ error: 'store (slug) requerido' });

    const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /api/products
 * body: { title, slug, price, description?, imageUrl?, storeSlug }
 * Crea producto (auth requerida)
 */
productsRouter.post('/', requireAuth as any, async (req: any, res) => {
  try {
    const { title, slug, price, description, imageUrl, storeSlug, isFeatured, categorySlugs = [] } = req.body ?? {};
    if (!title || !slug || price == null || !storeSlug) {
      return res.status(400).json({ error: 'title, slug, price y storeSlug son requeridos' });
    }

    const store = await prisma.store.findUnique({ where: { slug: String(storeSlug).trim() } });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    // (Opcional) validar que req.user.uid sea owner o admin de la tienda.
    // Ejemplo rápido:
    // const isOwner = store.ownerUserId === req.user.uid;
    // const isAdmin = await prisma.storeAdmin.findFirst({ where: { storeId: store.id, userId: req.user.uid }});
    // if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });

    // Slug único por tienda
    const exists = await prisma.product.findFirst({
      where: { storeId: store.id, slug: String(slug).trim() },
      select: { id: true },
    });
    if (exists) return res.status(409).json({ error: 'slug_duplicado' });

    // Prisma Decimal acepta string o number; uso string para evitar problemas regionales
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: String(title).trim(),
        slug: String(slug).trim(),
        price: String(price),                    // ✅ Decimal seguro
        description: description ? String(description) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
      },
    });

    const created = await prisma.product.create({
      data: {
        storeId: store.id,
        title,
        slug,
        price,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        isFeatured: Boolean(isFeatured),

        categoryLinks: categorySlugs.length ? {
          create: await Promise.all(
            categorySlugs.map(async (cs: string) => {
              const cat = await prisma.category.findUnique({
                where: {storeId_slug: { storeId: store.id, slug: cs } }
              });
              if (!cat) return null;
              return { categoryId: cat.id };
            })
          ).then(a => a.filter(Boolean)) as { categoryId: string }[],
        } : undefined,
      },
      include: { categoryLinks: {include: { category: true } } },
    });

    res.status(201).json({ product: created });

    // Relacionar categorías
    if (categorySlugs.length > 0) {
      const categories = await prisma.category.findMany({
        where: { slug: { in: categorySlugs } },
        select: { id: true },
      });
      await prisma.productCategory.createMany({
        data: categories.map((cat) => ({
          productId: created.id,
          categoryId: cat.id,
        })),
      });
    }

    res.status(201).json({ product: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * PATCH /api/products/:id
 * body: { title?, slug?, price?, description?, imageUrl? }
 */
productsRouter.patch('/:id', requireAuth as any, async (req, res) => {
  try {
    const id = String(req.params.id);
    const data: any = {};

    if (req.body.title != null) data.title = String(req.body.title).trim();
    if (req.body.slug  != null) data.slug  = String(req.body.slug).trim();
    if (req.body.price != null) data.price = String(req.body.price);
    if (req.body.description != null) data.description = req.body.description ? String(req.body.description) : null;
    if (req.body.imageUrl    != null) data.imageUrl    = req.body.imageUrl ? String(req.body.imageUrl) : null;

    const product = await prisma.product.update({ where: { id }, data });
    res.json({ product });
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'product_not_found' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'slug_duplicado' });
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * DELETE /api/products/:id
 */
productsRouter.delete('/:id', requireAuth as any, async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'product_not_found' });
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

productsRouter.get('/', async (req, res) => {
  const storeSlug = String(req.query.store || '');
  const catSlug   = req.query.cat ? String(req.query.cat) : null;
  if (!storeSlug) return res.status(400).json({ error: 'store requerido' });

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return res.status(404).json({ error: 'store not found' });

  const where = {
    storeId: store.id,
    ...(catSlug ? {
      categoryLinks: { some: { category: { slug: catSlug } } }
    } : {})
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      categoryLinks: { include: { category: true } }
    }
  });

  res.json({ products });
});

// saveProduct function (usado en admin.js)
export async function saveProduct(product: {
  id?: string;
  title: string;
  slug: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  storeSlug: string;
}) {
  if (product.id) {
    // Update existing product
    return await prisma.product.update({
      where: { id: product.id },
      data: {
        title: product.title,
        slug: product.slug,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
      },
    });
  } else {
    // Find the store by slug to get its id
    const store = await prisma.store.findUnique({
      where: { slug: product.storeSlug },
      select: { id: true },
    });
    if (!store) throw new Error('store_not_found');
    // Create new product with storeId
    return await prisma.product.create({
      data: {
        title: product.title,
        slug: product.slug,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        storeId: store.id,
      },
    });
  }
}
// export { saveProduct }; // Si prefieres exportarlo por separado
// Nota: Asegúrate de manejar la autenticación y autorización adecuadamente en un entorno de producción.