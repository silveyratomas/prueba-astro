// server/routes/products.ts
import { Router } from 'express';
import { prisma } from '../db/prisma';     // ✅ singleton que ya tenés
import { requireAuth } from './auth';

export const productsRouter = Router();

/**
 * GET /api/products?store=mi-tienda-demo[&cat=slug-cat]
 * Lista productos de una tienda; opcional filtrar por categoría
 */
productsRouter.get('/', async (req, res) => {
  try {
    const storeSlug = String(req.query.store || '').trim();
    const catSlug = req.query.cat ? String(req.query.cat).trim() : null;

    if (!storeSlug) return res.status(400).json({ error: 'store (slug) requerido' });

    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true },
    });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    const where: any = { storeId: store.id };
    if (catSlug) {
      // filtra por categoría vinculada
      where.categoryLinks = { some: { category: { slug: catSlug } } };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        categoryLinks: { include: { category: true } },
      },
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
 * body: { title, slug, price, description?, imageUrl?, storeSlug, isFeatured?, categorySlugs?: string[] }
 * Crea producto (auth requerida)
 */
productsRouter.post('/', requireAuth as any, async (req: any, res) => {
  try {
    const {
      title,
      slug,
      price,
      description,
      imageUrl,
      storeSlug,
      isFeatured,
      categorySlugs = [],
    } = req.body ?? {};

    if (!title || !slug || price == null || !storeSlug) {
      return res.status(400).json({ error: 'title, slug, price y storeSlug son requeridos' });
    }

    const store = await prisma.store.findUnique({
      where: { slug: String(storeSlug).trim() },
      select: { id: true },
    });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    // Enforzar slug único por tienda
    const conflict = await prisma.product.findFirst({
      where: { storeId: store.id, slug: String(slug).trim() },
      select: { id: true },
    });
    if (conflict) return res.status(409).json({ error: 'slug_duplicado' });

    // Crear producto (Decimal como string para seguridad regional)
    const created = await prisma.product.create({
      data: {
        storeId: store.id,
        title: String(title).trim(),
        slug: String(slug).trim(),
        price: String(price),
        description: description ? String(description) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        isFeatured: Boolean(isFeatured),
      },
    });

    // Vincular categorías si se enviaron
    if (Array.isArray(categorySlugs) && categorySlugs.length > 0) {
      // buscar categorías válidas por (storeId, slug)
      const cats = await prisma.category.findMany({
        where: {
          storeId: store.id,
          slug: { in: categorySlugs.map((s: string) => s.trim()) },
        },
        select: { id: true },
      });

      if (cats.length > 0) {
        await prisma.productCategory.createMany({
          data: cats.map((c) => ({ productId: created.id, categoryId: c.id })),
          skipDuplicates: true,
        });
      }
    }

    // devolver con links
    const product = await prisma.product.findUnique({
      where: { id: created.id },
      include: { categoryLinks: { include: { category: true } } },
    });

    res.status(201).json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * PATCH /api/products/:id
 * body: { title?, slug?, price?, description?, imageUrl?, isFeatured?, categorySlugs? }
 * Nota: si se envía categorySlugs, reemplaza las relaciones.
 */
productsRouter.patch('/:id', requireAuth as any, async (req, res) => {
  try {
    const id = String(req.params.id);

    const data: any = {};
    if (req.body.title != null) data.title = String(req.body.title).trim();
    if (req.body.slug != null) data.slug = String(req.body.slug).trim();
    if (req.body.price != null) data.price = String(req.body.price);
    if (req.body.description != null) data.description = req.body.description ? String(req.body.description) : null;
    if (req.body.imageUrl != null) data.imageUrl = req.body.imageUrl ? String(req.body.imageUrl) : null;
    if (req.body.isFeatured != null) data.isFeatured = Boolean(req.body.isFeatured);

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    // actualizar categorías si llegan
    if (Array.isArray(req.body.categorySlugs)) {
      const product = await prisma.product.findUnique({
        where: { id },
        select: { storeId: true },
      });
      if (!product) return res.status(404).json({ error: 'product_not_found' });

      // borrar links actuales
      await prisma.productCategory.deleteMany({ where: { productId: id } });

      // crear nuevos links
      const cats = await prisma.category.findMany({
        where: {
          storeId: product.storeId,
          slug: { in: req.body.categorySlugs.map((s: string) => s.trim()) },
        },
        select: { id: true },
      });
      if (cats.length > 0) {
        await prisma.productCategory.createMany({
          data: cats.map((c) => ({ productId: id, categoryId: c.id })),
          skipDuplicates: true,
        });
      }
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { categoryLinks: { include: { category: true } } },
    });

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
