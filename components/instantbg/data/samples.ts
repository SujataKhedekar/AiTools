import { PhotoItem, StudioGradient } from '../types/studio';

export const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'sample-sneaker',
    name: 'Aero Runner',
    category: 'Product',
    src: '/instantbg/assets/sample_sneaker_product_1795332729086.jpg',
    isSample: true,
  },
  {
    id: 'sample-portrait',
    name: 'Editorial Blazer',
    category: 'Portrait',
    src: '/instantbg/assets/sample_portrait_studio_1795332727676.jpg',
    isSample: true,
  },
  {
    id: 'sample-headphones',
    name: 'Studio Audio',
    category: 'Hardware',
    src: '/instantbg/assets/sample_headphones_product_1795332728066.jpg',
    isSample: true,
  },
  {
    id: 'sample-dog',
    name: 'Garden Shepherd',
    category: 'Pet',
    src: '/instantbg/assets/sample_dog_portrait_1795332728944.jpg',
    isSample: true,
  },
];

export const STUDIO_COLORS: { label: string; hex: string }[] = [
  { label: 'Pure White', hex: '#FFFFFF' },
  { label: 'Gallery Paper', hex: '#F3F4F6' },
  { label: 'Warm Stone', hex: '#E7E2DA' },
  { label: 'Cool Slate', hex: '#CBD5E1' },
  { label: 'Charcoal', hex: '#181A20' },
  { label: 'Jet Black', hex: '#050507' },
  { label: 'Cobalt Studio', hex: '#1D4ED8' },
  { label: 'Forest Matte', hex: '#14532D' },
  { label: 'Terracotta', hex: '#B4533C' },
  { label: 'Sand Amber', hex: '#D9A760' },
];

export const STUDIO_GRADIENTS: StudioGradient[] = [
  {
    id: 'studio-slate',
    name: 'Cyclorama Slate',
    css: 'linear-gradient(155deg, #272B36 0%, #101218 100%)',
    stops: ['#272B36', '#101218'],
    angleDeg: 155,
  },
  {
    id: 'gallery-mist',
    name: 'Gallery Mist',
    css: 'linear-gradient(180deg, #F8FAFC 0%, #DCE3EC 100%)',
    stops: ['#F8FAFC', '#DCE3EC'],
    angleDeg: 180,
  },
  {
    id: 'cobalt-sweep',
    name: 'Cobalt Sweep',
    css: 'linear-gradient(145deg, #2563EB 0%, #0F172A 100%)',
    stops: ['#2563EB', '#0F172A'],
    angleDeg: 145,
  },
  {
    id: 'warm-plaster',
    name: 'Warm Plaster',
    css: 'linear-gradient(160deg, #F5EFE6 0%, #D8CBB8 100%)',
    stops: ['#F5EFE6', '#D8CBB8'],
    angleDeg: 160,
  },
  {
    id: 'sage-editorial',
    name: 'Sage Editorial',
    css: 'linear-gradient(155deg, #D9E4DD 0%, #8FA89B 100%)',
    stops: ['#D9E4DD', '#8FA89B'],
    angleDeg: 155,
  },
  {
    id: 'dusk-copper',
    name: 'Dusk Copper',
    css: 'linear-gradient(145deg, #3B2F2F 0%, #161214 100%)',
    stops: ['#3B2F2F', '#161214'],
    angleDeg: 145,
  },
];
