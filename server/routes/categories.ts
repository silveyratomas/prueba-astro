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
      select: { id: true, name: true, slug: true, parentId: true },
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
    const { storeSlug, name, slug, parentSlug } = req.body ?? {};
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
      data: {
        storeId: store.id,
        name,
        slug,
        parentId,
      },
    });

    res.status(201).json({ category });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});
