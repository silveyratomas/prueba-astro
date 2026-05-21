// prisma/demo-products.ts
// Carga categorías + productos demo en la tienda "mi-tienda-demo"
// Uso: tsx prisma/demo-products.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STORE_SLUG = 'mi-tienda-demo';

// Imagen de Picsum con seed fijo → siempre la misma foto
const img = (seed: string | number, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) throw new Error(`Store "${STORE_SLUG}" no encontrada. Ejecutá el seed primero.`);

  console.log(`\n→ Cargando datos en "${store.name}" (${store.id})\n`);

  /* ─── CATEGORÍAS ─────────────────────────────────────────────── */

  const cats = await Promise.all([
    upsertCat(store.id, 'Indumentaria',   'indumentaria',   null,  false),
    upsertCat(store.id, 'Electrónica',    'electronica',    null,  false),
    upsertCat(store.id, 'Hogar',          'hogar',          null,  false),
    upsertCat(store.id, 'Ofertas',        'ofertas',        null,  true),
  ]);

  const [indumentaria, electronica, hogar, ofertas] = cats;

  // subcategorías
  const [remeras, pantalones, zapatillas, celulares, accesorios, deco, cocina] = await Promise.all([
    upsertCat(store.id, 'Remeras',       'remeras',       indumentaria.id, false),
    upsertCat(store.id, 'Pantalones',    'pantalones',    indumentaria.id, false),
    upsertCat(store.id, 'Zapatillas',    'zapatillas',    indumentaria.id, false),
    upsertCat(store.id, 'Celulares',     'celulares',     electronica.id,  false),
    upsertCat(store.id, 'Accesorios',    'accesorios',    electronica.id,  false),
    upsertCat(store.id, 'Decoración',    'decoracion',    hogar.id,        false),
    upsertCat(store.id, 'Cocina',        'cocina',        hogar.id,        false),
  ]);

  console.log('✓ Categorías listas');

  /* ─── PRODUCTOS ──────────────────────────────────────────────── */

  const products: ProductDef[] = [
    // ── Remeras
    {
      title: 'Remera Básica Blanca',
      slug: 'remera-basica-blanca',
      description: 'Remera de algodón 100% peinado, corte regular. Ideal para el día a día.',
      price: 8500,
      imageUrl: img('clothes1'),
      isFeatured: true,
      isOffer: false,
      categories: [remeras.id, indumentaria.id],
      variants: [
        { sku: 'RBB-S', name: 'Talle S', stock: 20 },
        { sku: 'RBB-M', name: 'Talle M', stock: 35 },
        { sku: 'RBB-L', name: 'Talle L', stock: 15 },
        { sku: 'RBB-XL', name: 'Talle XL', stock: 10 },
      ],
    },
    {
      title: 'Remera Oversize Negra',
      slug: 'remera-oversize-negra',
      description: 'Estilo urbano con corte oversize. Composición: 70% algodón, 30% poliéster.',
      price: 11200,
      imageUrl: img('clothes2'),
      isFeatured: true,
      isOffer: false,
      categories: [remeras.id],
      variants: [
        { sku: 'RON-S', name: 'Talle S', stock: 12 },
        { sku: 'RON-M', name: 'Talle M', stock: 25 },
        { sku: 'RON-L', name: 'Talle L', stock: 18 },
      ],
    },
    {
      title: 'Remera Estampada Retro',
      slug: 'remera-estampada-retro',
      description: 'Diseño gráfico retro impreso con técnica screen printing.',
      price: 13500,
      imageUrl: img('fashion10'),
      isFeatured: false,
      isOffer: true,
      categories: [remeras.id, ofertas.id],
      variants: [
        { sku: 'RER-M', name: 'Talle M', stock: 8 },
        { sku: 'RER-L', name: 'Talle L', stock: 14 },
        { sku: 'RER-XL', name: 'Talle XL', stock: 6 },
      ],
    },

    // ── Pantalones
    {
      title: 'Jean Slim Azul',
      slug: 'jean-slim-azul',
      description: 'Jean de corte slim en denim azul clásico. Composición: 98% algodón, 2% elastano.',
      price: 24900,
      imageUrl: img('jeans1'),
      isFeatured: true,
      isOffer: false,
      categories: [pantalones.id, indumentaria.id],
      variants: [
        { sku: 'JSA-30', name: 'Talle 30', stock: 10 },
        { sku: 'JSA-32', name: 'Talle 32', stock: 18 },
        { sku: 'JSA-34', name: 'Talle 34', stock: 12 },
        { sku: 'JSA-36', name: 'Talle 36', stock: 7 },
      ],
    },
    {
      title: 'Pantalón Cargo Beige',
      slug: 'pantalon-cargo-beige',
      description: 'Pantalón cargo con múltiples bolsillos. Tela ripstop resistente al agua.',
      price: 19800,
      imageUrl: img('pants2'),
      isFeatured: false,
      isOffer: true,
      categories: [pantalones.id, ofertas.id],
      variants: [
        { sku: 'PCB-S', name: 'Talle S', stock: 15 },
        { sku: 'PCB-M', name: 'Talle M', stock: 20 },
        { sku: 'PCB-L', name: 'Talle L', stock: 10 },
      ],
    },

    // ── Zapatillas
    {
      title: 'Zapatillas Running Pro',
      slug: 'zapatillas-running-pro',
      description: 'Suela de goma EVA con amortiguación extra. Ideal para running y gym.',
      price: 45000,
      imageUrl: img('shoes1'),
      isFeatured: true,
      isOffer: false,
      categories: [zapatillas.id, indumentaria.id],
      variants: [
        { sku: 'ZRP-40', name: 'Número 40', stock: 5 },
        { sku: 'ZRP-41', name: 'Número 41', stock: 8 },
        { sku: 'ZRP-42', name: 'Número 42', stock: 12 },
        { sku: 'ZRP-43', name: 'Número 43', stock: 9 },
        { sku: 'ZRP-44', name: 'Número 44', stock: 4 },
      ],
    },
    {
      title: 'Zapatillas Urbanas Blancas',
      slug: 'zapatillas-urbanas-blancas',
      description: 'Diseño minimalista, cuero sintético lavable. Suela anti-deslizante.',
      price: 38500,
      imageUrl: img('shoes3'),
      isFeatured: false,
      isOffer: false,
      categories: [zapatillas.id],
      variants: [
        { sku: 'ZUB-39', name: 'Número 39', stock: 6 },
        { sku: 'ZUB-40', name: 'Número 40', stock: 11 },
        { sku: 'ZUB-41', name: 'Número 41', stock: 7 },
        { sku: 'ZUB-42', name: 'Número 42', stock: 5 },
      ],
    },

    // ── Celulares
    {
      title: 'Smartphone Alpha X10',
      slug: 'smartphone-alpha-x10',
      description: 'Pantalla AMOLED 6.5", batería 5000mAh, cámara triple 50MP. Android 14.',
      price: 189900,
      imageUrl: img('phone1'),
      isFeatured: true,
      isOffer: false,
      categories: [celulares.id, electronica.id],
      variants: [
        { sku: 'SAX-128', name: '128 GB Negro', stock: 15 },
        { sku: 'SAX-256', name: '256 GB Negro', price: 219900, stock: 8 },
        { sku: 'SAX-128B', name: '128 GB Blanco', stock: 10 },
      ],
    },
    {
      title: 'Smartphone Beta S5',
      slug: 'smartphone-beta-s5',
      description: 'Diseño ultra-delgado 7.2mm, chip A-series, Face ID. iOS 17.',
      price: 349900,
      imageUrl: img('phone2'),
      isFeatured: true,
      isOffer: false,
      categories: [celulares.id, electronica.id],
      variants: [
        { sku: 'SBS-128', name: '128 GB Titanio', stock: 5 },
        { sku: 'SBS-256', name: '256 GB Titanio', price: 399900, stock: 4 },
        { sku: 'SBS-512', name: '512 GB Titanio', price: 469900, stock: 2 },
      ],
    },

    // ── Accesorios
    {
      title: 'Auriculares Bluetooth TWS',
      slug: 'auriculares-bluetooth-tws',
      description: 'True wireless, cancelación de ruido activa, 30hs de batería total.',
      price: 29900,
      imageUrl: img('tech5'),
      isFeatured: false,
      isOffer: false,
      categories: [accesorios.id, electronica.id],
    },
    {
      title: 'Cargador Inalámbrico 15W',
      slug: 'cargador-inalambrico-15w',
      description: 'Compatible con Qi. Carga rápida 15W. Incluye cable USB-C.',
      price: 12500,
      imageUrl: img('tech7'),
      isFeatured: false,
      isOffer: true,
      categories: [accesorios.id, ofertas.id],
    },
    {
      title: 'Funda Cuero iPhone / Samsung',
      slug: 'funda-cuero-universal',
      description: 'Cuero genuino, cierre magnético, tarjetero. Compatible con modelos principales.',
      price: 7800,
      imageUrl: img('tech9'),
      isFeatured: false,
      isOffer: false,
      categories: [accesorios.id],
      variants: [
        { sku: 'FCU-IPH', name: 'iPhone 14/15', stock: 30 },
        { sku: 'FCU-SAM', name: 'Samsung S23/S24', stock: 25 },
        { sku: 'FCU-MOT', name: 'Motorola Edge', stock: 18 },
      ],
    },

    // ── Decoración
    {
      title: 'Cuadro Abstracto 60x80',
      slug: 'cuadro-abstracto-60x80',
      description: 'Impresión en canvas de alta resolución. Marco de pino. Lista para colgar.',
      price: 18000,
      imageUrl: img('abstract1'),
      isFeatured: false,
      isOffer: false,
      categories: [deco.id, hogar.id],
    },
    {
      title: 'Lámpara de Mesa Nórdica',
      slug: 'lampara-mesa-nordica',
      description: 'Base cerámica, pantalla de lino. E27. Altura 45cm. Estilo escandinavo.',
      price: 22500,
      imageUrl: img('interior3'),
      isFeatured: true,
      isOffer: false,
      categories: [deco.id, hogar.id],
    },

    // ── Cocina
    {
      title: 'Set Cuchillos Profesional 6 piezas',
      slug: 'set-cuchillos-profesional',
      description: 'Acero inoxidable alemán, mangos ergonómicos, soporte magnético incluido.',
      price: 35900,
      imageUrl: img('kitchen1'),
      isFeatured: false,
      isOffer: true,
      categories: [cocina.id, hogar.id, ofertas.id],
    },
    {
      title: 'Cafetera Italiana 6 tazas',
      slug: 'cafetera-italiana-6',
      description: 'Aluminio fundido, válvula de seguridad, apta para todas las hornallas.',
      price: 9800,
      imageUrl: img('kitchen4'),
      isFeatured: false,
      isOffer: false,
      categories: [cocina.id],
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { storeId: store.id, slug: p.slug } });
    if (exists) { skipped++; continue; }

    await prisma.product.create({
      data: {
        storeId: store.id,
        title: p.title,
        slug: p.slug,
        description: p.description ?? null,
        price: p.price,
        imageUrl: p.imageUrl,
        isFeatured: p.isFeatured ?? false,
        isOffer: p.isOffer ?? false,
        variants: p.variants?.length
          ? { create: p.variants.map(v => ({ sku: v.sku, name: v.name, price: v.price ?? null, stock: v.stock ?? 0 })) }
          : undefined,
        categoryLinks: {
          create: p.categories.map(categoryId => ({ categoryId })),
        },
      },
    });
    created++;
    process.stdout.write(`  ✓ ${p.title}\n`);
  }

  console.log(`\n✅ Productos: ${created} creados, ${skipped} ya existían`);
  console.log(`   Tienda: http://localhost:4321  |  Admin: http://localhost:4321/admin\n`);
}

type ProductDef = {
  title: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl: string;
  isFeatured?: boolean;
  isOffer?: boolean;
  categories: string[];
  variants?: { sku: string; name: string; price?: number; stock?: number }[];
};

async function upsertCat(storeId: string, name: string, slug: string, parentId: string | null, isOffer: boolean) {
  const existing = await prisma.category.findFirst({ where: { storeId, slug } });
  if (existing) return existing;
  return prisma.category.create({
    data: { storeId, name, slug, parentId, isOffer } as any,
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
