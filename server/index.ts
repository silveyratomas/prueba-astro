// server/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { categoriesRouter } from './routes/categories';
import { ordersRouter } from './routes/orders';
import debugRouter from './routes/debug';
import shopRouter from './routes/shop-auth';
import uploadRouter from './routes/upload';
import path from 'path';

const app = express();
const prisma = new PrismaClient(); // <- ok dejarlo aunque no se use acá

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:4321';
const API_PORT = Number(process.env.API_PORT || 8787);

// CORS global (acepta una o varias origins separadas por coma)
app.use(cors({
  origin: FRONT_ORIGIN.split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// (opcional) si querés preflight explícito, en Express 5 evitá comodines tipo /api/*
// app.options('/api', cors());

app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// (opcional) mini logger para chequear si llega Authorization
// app.use((req, _res, next) => {
//   console.log(`[api] ${req.method} ${req.path} auth=${req.headers.authorization ? 'yes' : 'no'}`);
//   next();
// });

// Health
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'api', ts: new Date().toISOString() })
);

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shop', shopRouter);
app.use('/api/upload', uploadRouter);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRouter);
}

// (opcional, seguro en Express 5) 404 dentro de /api SIN comodines
// app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(API_PORT, () => {
  console.log(`[api] escuchando en http://localhost:${API_PORT}`);
  console.log(`[api] CORS allow: ${FRONT_ORIGIN}`);
});
