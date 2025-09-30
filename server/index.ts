// server/index.ts
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { categoriesRouter } from './routes/categories';

const app = express();

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:4321';
const API_PORT = Number(process.env.API_PORT || 8787);

app.use('/api/categories', categoriesRouter);

app.use(cors({ origin: FRONT_ORIGIN, credentials: true }));
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'api', ts: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRouter);
app.use('/api', productsRouter); // expone /api/stores/:slug/products
app.use('/api/products', productsRouter);     // expone /api/products (CRUD)

app.listen(API_PORT, () => {
  console.log(`[api] escuchando en http://localhost:${API_PORT}`);
  console.log(`[api] CORS allow: ${FRONT_ORIGIN}`);
});
