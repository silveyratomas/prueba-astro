import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ADMIN del SaaS
  const adminEmail = 'silveyramattostomas@gmail.com';
  const adminPass  = 'admin123';
  const adminHash  = await bcrypt.hash(adminPass, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: 'Admin Global',
      role: UserRole.ADMIN,
    },
  });

  // MERCHANT (dueño de una tienda)
  const merchEmail = 'buleria.games@gmail.com';
  const merchPass  = 'owner123';
  const merchHash  = await bcrypt.hash(merchPass, 10);

  const merchant = await prisma.user.upsert({
    where: { email: merchEmail },
    update: {},
    create: {
      email: merchEmail,
      passwordHash: merchHash,
      name: 'Dueño Demo',
      role: UserRole.MERCHANT,
    },
  });

  // Tienda del MERCHANT
  const store = await prisma.store.upsert({
    where: { slug: 'mi-tienda-demo' },
    update: {},
    create: {
      name: 'Mi Tienda Demo',
      slug: 'mi-tienda-demo',
      ownerUserId: merchant.id,
      status: 'ACTIVE',
    },
  });

  // El merchant también como admin operador (opcional pero útil)
  await prisma.storeAdmin.upsert({
    where: { storeId_userId: { storeId: store.id, userId: merchant.id } },
    update: {},
    create: {
      storeId: store.id,
      userId: merchant.id,
      role: 'owner',
    },
  });

  console.log('Seed listo:');
  console.log('ADMIN  ->', adminEmail, adminPass);
  console.log('OWNER  ->', merchEmail, merchPass, 'store:', store.slug);
}

main().finally(() => prisma.$disconnect());
