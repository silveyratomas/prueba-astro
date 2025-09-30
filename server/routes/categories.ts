import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const categoriesRouter = Router();

// GET /api/categories?store=mi-tienda
categoriesRouter.get('/', async (req, res) => {
  const storeSlug = String(req.query.store || '');
  if (!storeSlug) return res.status(400).json({ error: 'store requerido' });

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return res.status(404).json({ error: 'store not found' });

  const list = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  res.json({ categories: list });
});

// POST /api/categories  (protegido)
categoriesRouter.post('/', requireAuth, async (req: any, res) => {
  const { storeSlug, name, slug, parentId } = req.body ?? {};
  if (!storeSlug || !name || !slug) return res.status(400).json({ error: 'storeSlug, name, slug requeridos' });

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return res.status(404).json({ error: 'store not found' });

  const cat = await prisma.category.create({
    data: { storeId: store.id, name, slug, parentId: parentId || null },
  });

  res.status(201).json({ category: cat });
});

// PATCH /api/categories/:id  (editar)
categoriesRouter.patch('/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { name, slug, parentId } = req.body ?? {};
  const cat = await prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
    },
  });
  res.json({ category: cat });
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await prisma.productCategory.deleteMany({ where: { categoryId: id } }); // limpia pivote
  await prisma.category.delete({ where: { id } });
  res.json({ ok: true });
});
