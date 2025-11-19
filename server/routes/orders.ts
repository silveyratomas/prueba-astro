import { Router } from 'express';
import { prisma } from '../db/prisma';

export const ordersRouter = Router();

// POST /api/orders
ordersRouter.post('/', async (req, res) => {
    try {
        const {
            storeSlug,
            nombre,
            telefono,
            email,
            direccion,
            shipping, // 'retiro' | 'envio'
            pago,     // 'Tarjeta' | 'Transferencia' | ...
            cupon,    // string
            notas,
            cart_json,
            total_final
        } = req.body;

        if (!storeSlug) {
            return res.status(400).json({ error: 'Falta storeSlug' });
        }

        // 1. Buscar la tienda
        const store = await prisma.store.findUnique({
            where: { slug: storeSlug }
        });

        if (!store) {
            return res.status(404).json({ error: 'Tienda no encontrada' });
        }

        // 2. Parsear carrito
        let items = [];
        try {
            items = typeof cart_json === 'string' ? JSON.parse(cart_json) : cart_json;
        } catch (e) {
            return res.status(400).json({ error: 'Carrito inválido' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // 3. Validar productos y precios contra DB
        // Para evitar errores de FK (productId inválido) y precios manipulados.
        const productIdsOrSlugs = items.map((i: any) => ({ id: i.id, slug: i.slug }));

        // Buscamos todos los productos que coincidan con ID o Slug en esta tienda
        const dbProducts = await prisma.product.findMany({
            where: {
                storeId: store.id,
                OR: [
                    { id: { in: productIdsOrSlugs.map((x: any) => x.id).filter(Boolean) } },
                    { slug: { in: productIdsOrSlugs.map((x: any) => x.slug).filter(Boolean) } }
                ]
            }
        });

        // Mapeamos items del carrito a productos reales
        const validItems = [];
        let subtotal = 0;

        for (const item of items) {
            // Intentar matchear por ID primero, luego por slug
            const p = dbProducts.find(dp => dp.id === item.id) || dbProducts.find(dp => dp.slug === item.slug);

            if (!p) {
                // Si un producto no existe, lo ignoramos o fallamos. 
                // Para ser estrictos, fallamos.
                return res.status(400).json({ error: `El producto '${item.title}' ya no está disponible.` });
            }

            const qty = Math.max(1, Number(item.qty) || 1);
            const price = Number(p.price); // Usamos precio de DB

            subtotal += price * qty;

            validItems.push({
                productId: p.id,
                titleSnapshot: p.title,
                qty,
                price
            });
        }

        // Lógica simple de envío
        const shippingCost = shipping === 'envio' && subtotal < 100000 ? 1500 : 0;

        // Lógica simple de descuento (hardcoded PROMO10)
        let discount = 0;
        if (cupon === 'PROMO10') {
            discount = subtotal * 0.10;
        }

        const total = subtotal - discount + shippingCost;

        // 4. Crear la orden
        // Primero aseguramos el usuario para conectar todo bien desde el principio
        // OJO: shop-auth usa emails compuestos: storeId::email para clientes de tienda
        const emailLower = email.toLowerCase();
        const compositeEmail = `${store.id}::${emailLower}`;

        let user = await prisma.user.findUnique({ where: { email: compositeEmail } });

        // Fallback: buscar por email plano (por si es admin o legacy)
        if (!user) {
            user = await prisma.user.findUnique({ where: { email: emailLower } });
        }

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: compositeEmail,
                    name: nombre,
                    passwordHash: '$2b$10$guestUserHashPlaceholder...',
                    role: 'CUSTOMER'
                }
            });
        }

        // Asegurar StoreCustomer
        const storeCustomer = await prisma.storeCustomer.upsert({
            where: {
                storeId_userId: {
                    storeId: store.id,
                    userId: user.id
                }
            },
            update: {
                phone: telefono || undefined,
                address: direccion || undefined,
                name: nombre || undefined
            } as any,
            create: {
                storeId: store.id,
                userId: user.id,
                email,
                name: nombre,
                phone: telefono,
                address: direccion
            } as any
        });

        const order = await prisma.order.create({
            data: {
                storeId: store.id,
                userId: user.id,
                status: 'PENDING',
                currency: 'ARS',
                subtotal,
                discount,
                shipping: shippingCost,
                total,
                items: {
                    create: validItems.map(vi => ({
                        productId: vi.productId,
                        titleSnapshot: vi.titleSnapshot,
                        qty: vi.qty,
                        price: vi.price
                    }))
                },
                shippingInfo: shipping === 'envio' ? {
                    create: {
                        address: direccion || 'Sin dirección',
                        shippingPro: 'propio',
                        status: 'PENDING'
                    }
                } : undefined
            }
        });

        // También podríamos crear/actualizar StoreCustomer
        // ...

        // 5. Crear registro de pago (PENDING)
        await prisma.payment.create({
            data: {
                orderId: order.id,
                provider: pago || 'other',
                amount: total,
                status: 'PENDING',
                payloadJson: { notas, telefono } // Guardamos notas y teléfono acá por ahora
            }
        });

        return res.json({ ok: true, orderId: order.id });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Error al procesar la orden' });
    }
});

export default ordersRouter;
