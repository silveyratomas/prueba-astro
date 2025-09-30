// server/routes/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
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
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  // normalizá el email
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'credenciales inválidas' });

  // DEMO: si tu seed guardó la password en texto plano
  const ok =
    (email === 'buleria.games@gmail.com' && password === 'owner123') ||
    (email === 'silveyramattostomas@gmail.com' && password === 'admin123');

  // En producción hacé:
  // const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });

  const token = signToken({ uid: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// === /api/auth/me
authRouter.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
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
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'token faltante' });
    const payload = verifyToken(token);
    req.user = payload; // { uid, role }
    next();
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
}
