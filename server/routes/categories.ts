// server/routes/categories.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const categoriesRouter = Router();

// GET /api/categories?store=mi-tienda
categoriesRouter.get('/', async (req, res) => {
  try {
    const storeSlug = String(req.query.store || '');
    if (!storeSlug) return res.status(400).json({ error: 'store (slug) requerido' });

    const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      // cast a any para incluir isOffer hasta regenerar prisma client
      select: ({ id: true, name: true, slug: true, parentId: true, isOffer: true } as any),
    });

    res.json({ categories });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/categories
categoriesRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    const { storeSlug, name, slug, parentSlug, isOffer } = req.body ?? {};
    if (!storeSlug || !name || !slug) return res.status(400).json({ error: 'storeSlug, name y slug son requeridos' });

    const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
    if (!store) return res.status(404).json({ error: 'store no encontrada' });

    let parentId: string | null = null;
    if (parentSlug) {
      const parent = await prisma.category.findFirst({
        where: { storeId: store.id, slug: parentSlug },
        select: { id: true },
      });
      if (parent) parentId = parent.id;
    }

    const category = await prisma.category.create({
      data: ({
        storeId: store.id,
        name,
        slug,
        parentId,
        isOffer: Boolean(isOffer),
      } as any),
    });

    res.status(201).json({ category });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// PATCH /api/categories/:id  (editar categoría)
categoriesRouter.patch('/:id', requireAuth, async (req: any, res) => {
  try {
    const id = String(req.params.id);
    const { name, slug, parentSlug, isOffer } = req.body ?? {};

    const data: any = {};
    if (name != null) data.name = String(name).trim();
    if (slug != null) data.slug = String(slug).trim();
    if (isOffer != null) data.isOffer = Boolean(isOffer);

    if (parentSlug != null) {
      // buscar parentId si existe
      const storeCat = await prisma.category.findUnique({ where: { id }, select: { storeId: true } });
      if (!storeCat) return res.status(404).json({ error: 'category_not_found' });
      const parent = await prisma.category.findFirst({ where: { storeId: storeCat.storeId, slug: String(parentSlug).trim() }, select: { id: true } });
      data.parentId = parent ? parent.id : null;
    }

    const updated = await prisma.category.update({ where: { id }, data: (data as any) });
    res.json({ category: updated });
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'category_not_found' });
    res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const id = String(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'category_not_found' });
    res.status(500).json({ error: 'server_error' });
  }
});
