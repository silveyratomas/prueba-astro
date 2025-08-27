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
    slug: 'mate-imperial',
    title: 'Mate Imperial',
    price: 18000,
    img: '/imgs/celu1.jpeg',
    description: 'Mate de calabaza forrado en cuero con virola.',
    featured: true
  },
  {
    id: 2,
    slug: 'termo-acero',
    title: 'Termo de Acero 1L',
    price: 25000,
    img: '/imgs/infinix.jpeg',
    description: 'Doble pared, mantiene temperatura por 8 hs.',
    featured: true
  },
  {
    id: 3,
    slug: 'yerba-selecta-1kg',
    title: 'Yerba Selecta 1kg',
    price: 8000,
    img: '/imgs/redmi15C.jpeg',
    description: 'Yerba mate con estacionamiento natural.',
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
