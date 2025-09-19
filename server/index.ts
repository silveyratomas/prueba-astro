import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// rutas
app.use('/api/auth', authRouter);

// ejemplo opcional: listar productos por tienda (por slug)
// GET /api/stores/:slug/products
app.get('/api/stores/:slug/products', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const items = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true, description: true,
        price: true, imageUrl: true, isFeatured: true
      }
    });
    res.json({ items });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
