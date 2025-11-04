// server/routes/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma'; // 👈 usa el singleton, no new PrismaClient()

export const authRouter = Router();

// === util
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(payload: { uid: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    uid: string; role: string; iat: number; exp: number;
  };
}

// === /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

    // normalizá el email
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });

    const token = signToken({ uid: user.id, role: user.role });
    // set cookie httpOnly for convenience and also return token for clients
    res.cookie('tp_auth', token, { httpOnly: true, maxAge: 2 * 60 * 60 * 1000 });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error('[auth.login] error', e);
    res.status(500).json({ error: (e as any)?.message || 'internal error' });
  }
});

// === /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, storeId, storeSlug } = req.body ?? {};
    if (!email || !password || !name) return res.status(400).json({ error: 'name,email,password requeridos' });

    const lower = String(email).toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lower } });
    if (exists) return res.status(409).json({ error: 'email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email: lower, passwordHash: hash } });

    // if storeSlug provided, try to resolve it to storeId
    let targetStoreId = storeId;
    if (!targetStoreId && storeSlug) {
      const s = await prisma.store.findUnique({ where: { slug: String(storeSlug) } });
      if (s) targetStoreId = s.id;
    }

    // si se tiene storeId, creamos StoreCustomer
    if (targetStoreId) {
      try {
        await prisma.storeCustomer.create({ data: ({ storeId: targetStoreId, userId: user.id, name, email: lower, phone, address } as any) });
      } catch (e) {
        console.warn('[auth.register] storeCustomer create failed', (e as any)?.message);
      }
    }

    const token = signToken({ uid: user.id, role: user.role });
    res.cookie('tp_auth', token, { httpOnly: true, maxAge: 2 * 60 * 60 * 1000 });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error('[auth.register] error', e);
    res.status(500).json({ error: (e as any)?.message || 'internal error' });
  }
});

// === /api/auth/me
authRouter.get('/me', async (req, res) => {
  try {
    // token can come from Authorization header or httpOnly cookie
    const auth = req.headers.authorization || '';
    const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    // support cookie-parser (req.cookies) or fallback to parsing header
    let cookieToken = '';
    if (req.cookies && req.cookies.tp_auth) cookieToken = req.cookies.tp_auth;
    else if (req.headers && req.headers.cookie) {
      const m = String(req.headers.cookie).match(/(?:^|; )tp_auth=([^;]+)/);
      if (m) cookieToken = decodeURIComponent(m[1]);
    }
    const token = headerToken || cookieToken;
    if (!token) return res.status(401).json({ error: 'token faltante' });

    const { uid } = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(401).json({ error: 'token inválido' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
});

// === middleware para proteger rutas
export function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization || '';
    const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const cookieToken = req.cookies?.tp_auth || '';
    const token = headerToken || cookieToken;
    if (!token) return res.status(401).json({ error: 'token faltante' });
    const payload = verifyToken(token);
    req.user = payload; // { uid, role }
    next();
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
}

// PATCH /api/auth/me -> update current user's profile
authRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { name, phone, address } = req.body ?? {};
    const user = await prisma.user.update({ where: { id: uid }, data: { name, updatedAt: new Date() } });
    // update or create StoreCustomer entries optionally omitted for now
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'no se pudo actualizar' });
  }
});

// POST /api/auth/logout -> clear cookie
authRouter.post('/logout', (req, res) => {
  res.clearCookie('tp_auth');
  res.json({ ok: true });
});
