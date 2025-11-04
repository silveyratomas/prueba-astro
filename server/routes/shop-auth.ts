import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';

const shopRouter = Router();

const SHOP_JWT_SECRET = process.env.SHOP_JWT_SECRET || 'dev-shop-secret-change-me';

function signShopToken(payload: { cid: string }) {
    return jwt.sign(payload, SHOP_JWT_SECRET, { expiresIn: '7d' });
}

function verifyShopToken(token: string) {
    return jwt.verify(token, SHOP_JWT_SECRET) as { cid: string };
}

// POST /api/shop/auth/register
shopRouter.post('/auth/register', async (req, res) => {
    try {
        const { storeSlug: bodyStore, email, password, name } = req.body ?? {};
        const queryStore = req.query?.store as string | undefined;
        const storeSlug = (bodyStore || queryStore || process.env.DEFAULT_STORE_SLUG || '').toString() || undefined;
        if (!email || !password) return res.status(400).json({ error: 'email,password requeridos' });

        // resolve store: prefer slug, else fallback to first store
        let store = null;
        if (storeSlug) store = await prisma.store.findUnique({ where: { slug: String(storeSlug) } });
        if (!store) {
            // fallback: first store in DB
            store = await prisma.store.findFirst();
        }
        if (!store) return res.status(404).json({ error: 'store no encontrada' });

        // check if StoreCustomer unique per store+email
        const existing = await prisma.storeCustomer.findFirst({ where: { storeId: store.id, email: String(email).toLowerCase() } });
        if (existing) return res.status(409).json({ error: 'email ya registrado en esta tienda' });

        const hash = await bcrypt.hash(String(password), 10);
        // create a User and a StoreCustomer linked to the store
        const user = await prisma.user.create({ data: { name: name || null, email: String(email).toLowerCase(), passwordHash: hash, role: 'CUSTOMER' } });

        const customer = await prisma.storeCustomer.create({ data: { storeId: store.id, userId: user.id, name: name || null, email: String(email).toLowerCase() } as any });

        const token = signShopToken({ cid: customer.id });
        res.json({ token, customer: { id: customer.id, email: customer.email, name: customer.name } });
    } catch (e) {
        console.error('[shop.register] error', e);
        res.status(500).json({ error: (e as any)?.message || 'internal' });
    }
});

// POST /api/shop/auth/login
shopRouter.post('/auth/login', async (req, res) => {
    try {
        const { storeSlug: bodyStore, email, password } = req.body ?? {};
        const queryStore = req.query?.store as string | undefined;
        const storeSlug = (bodyStore || queryStore || process.env.DEFAULT_STORE_SLUG || '').toString() || undefined;
        if (!email || !password) return res.status(400).json({ error: 'email,password requeridos' });

        let store = null;
        if (storeSlug) store = await prisma.store.findUnique({ where: { slug: String(storeSlug) } });
        if (!store) store = await prisma.store.findFirst();
        if (!store) return res.status(404).json({ error: 'store no encontrada' });

        const customer = await prisma.storeCustomer.findFirst({ where: { storeId: store.id, email: String(email).toLowerCase() } });
        if (!customer) return res.status(401).json({ error: 'credenciales inválidas' });

        // load linked user
        const user = await prisma.user.findUnique({ where: { id: customer.userId } });
        if (!user) return res.status(401).json({ error: 'credenciales inválidas' });

        // Prevent admin/operator users from authenticating via the public shop login
        if (user.role && user.role !== 'CUSTOMER') return res.status(401).json({ error: 'credenciales inválidas' });

        const ok = await bcrypt.compare(String(password), user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });

        const token = signShopToken({ cid: customer.id });
        res.json({ token, customer: { id: customer.id, email: customer.email, name: customer.name } });
    } catch (e) {
        console.error('[shop.login] error', e);
        res.status(500).json({ error: (e as any)?.message || 'internal' });
    }
});

// middleware auth shop
async function requireShopAuth(req: any, res: any, next: any) {
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!token) return res.status(401).json({ error: 'token faltante' });
        const payload = verifyShopToken(token);
        req.shop = payload; // { cid, storeId }
        next();
    } catch (e) {
        return res.status(401).json({ error: 'token inválido' });
    }
}

// GET /api/shop/auth/me
shopRouter.get('/auth/me', requireShopAuth, async (req, res) => {
    try {
        const cid = (req as any).shop?.cid;
        if (!cid) return res.status(401).json({ error: 'no autorizado' });
        const customer = await prisma.storeCustomer.findUnique({ where: { id: cid } as any });
        if (!customer) return res.status(401).json({ error: 'no encontrado' });
        res.json({ customer: { id: customer.id, email: customer.email, name: customer.name, address: (customer as any).address || null } });
    } catch (e) {
        console.error('[shop.me] error', e);
        res.status(500).json({ error: 'internal' });
    }
});

// PATCH /api/shop/account -> update current customer
shopRouter.patch('/account', requireShopAuth, async (req, res) => {
    try {
        const cid = (req as any).shop?.cid;
        if (!cid) return res.status(401).json({ error: 'no autorizado' });
        const allowed = {} as any;
        // pick only fields that exist on StoreCustomer in schema: name,email,address,phone,avatarUrl,preferredContact,notes
        const body = req.body ?? {};
        if (typeof body.name === 'string') allowed.name = body.name;
        if (typeof body.email === 'string') allowed.email = body.email.toLowerCase();
        if (typeof body.address === 'string') allowed.address = body.address;
        if (typeof body.phone === 'string') allowed.phone = body.phone;
        if (typeof body.notes === 'string') allowed.notes = body.notes;

        const customer = await prisma.storeCustomer.update({ where: { id: cid } as any, data: allowed });
        res.json({ customer: { id: customer.id, email: customer.email, name: customer.name, address: (customer as any).address || null } });
    } catch (e) {
        console.error('[shop.patch] error', e);
        res.status(500).json({ error: 'no se pudo actualizar' });
    }
});

// GET /api/shop/orders?store=slug -> return orders for this customer and store (stub if no orders model)
shopRouter.get('/orders', requireShopAuth, async (req, res) => {
    try {
        // if Order model exists and linked, try to fetch; otherwise return empty array
        const cid = (req as any).shop?.cid;
        if (!cid) return res.status(401).json({ error: 'no autorizado' });
        // try to detect Order model via prisma
        try {
            // this will throw if orders relation not available, but prisma client includes it normally
            const sc = await prisma.storeCustomer.findUnique({ where: { id: cid } as any });
            const orders = await prisma.order.findMany({ where: { userId: sc?.userId } });
            return res.json({ orders: orders || [] });
        } catch (e) {
            return res.json({ orders: [] });
        }
    } catch (e) {
        console.error('[shop.orders] error', e);
        res.status(500).json({ error: 'internal' });
    }
});

export default shopRouter;
