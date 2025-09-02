export type Product = {
  id: number;
  slug: string;
  title: string;
  price: number;      // en PESOS (no centavos)
  img: string;
  description: string;
  featured?: boolean; // true = aparece en "Destacados"
};

export const products: Product[] = [
  {
    id: 1,
    slug: 'moto-g15',
    title: 'Moto G15',
    price: 18000,
    img: '/imgs/celu1.jpeg',
    description: 'Smartphone con pantalla de 6.5", 128GB de almacenamiento.',
    featured: true
  },
  {
    id: 2,
    slug: 'infinix-hot-50-pro',
    title: 'Infinix Hot 50 Pro 5G',
    price: 25000,
    img: '/imgs/infinix.jpeg',
    description: 'Dual Sim 256gb 8gb+8gb Ram Negro.',
    featured: true
  },
  {
    id: 5,
    slug: 'xiaomi-redmi-15c',
    title: 'Xiaomi Redmi 15C 128GB 4GB RAM',
    price: 180000, // en pesos, ajustá según corresponda
    img: '/imgs/redmi15C.jpeg',
    description: 'Pantalla 6.71" HD+, procesador MediaTek Helio G85, cámara 50MP, batería 5000mAh.',
    featured: true
  },
  {
    id: 4,
    slug: 'yerbera-lata',
    title: 'Yerbera de Lata',
    price: 3500,
    img: '/imgs/redmi15C.jpeg',
    description: 'Yerbera metálica con pico vertedor.',
    featured: false
  },
];
