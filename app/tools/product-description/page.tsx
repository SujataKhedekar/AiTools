import type { Metadata } from 'next';
import ProductDescriptionEntry from '@/components/product-desc/ProductDescriptionEntry';

export const metadata: Metadata = {
  title: 'AI Product Description Writer | Aivora',
  description: 'Create accurate ecommerce product descriptions, SEO metadata, marketplace listings, and bulk catalog exports.',
};

export default function ProductDescriptionPage() {
  return <ProductDescriptionEntry />;
}
