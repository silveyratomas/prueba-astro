import { Router } from 'express';
import { prisma } from '../db/prisma';

export const debugRouter = Router();

// Dev-only: listar usuarios (id, email, name, createdAt)
debugRouter.get('/users', async (_req, res) => {
    try {
        const list = await prisma.user.findMany({ select: { id: true, email: true, name: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
        res.json({ users: list });
    } catch (e) {
        console.error('[debug.users] error', e);
        res.status(500).json({ error: 'internal' });
    }
});

export default debugRouter;
