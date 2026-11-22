import type { Metadata } from 'next';
import ShopifySectionEntry from '@/components/shopify-section/ShopifySectionEntry';

export const metadata: Metadata = {
  title: 'Shopify AI Section Builder | Aivora',
  description: 'Turn ecommerce designs into editable Shopify Online Store 2.0 Liquid sections.',
};

export default function ShopifySectionBuilderPage() {
  return <ShopifySectionEntry />;
}
