export interface SampleDesignPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  suggestedSectionType: string;
  suggestedInstructions: string;
}

export const SAMPLE_DESIGN_PRESETS: SampleDesignPreset[] = [
  {
    id: 'hero-editorial-split',
    title: 'Editorial 50/50 Hero Banner',
    category: 'Hero Banner',
    description: 'Split-screen luxury homeware hero with dual CTAs and travertine studio photography.',
    imageUrl: '/shopify-section/assets/sample_hero_section_1795368505475.jpg',
    suggestedSectionType: 'Hero Banner',
    suggestedInstructions:
      'Build a responsive 50/50 split hero section with heading, subtext, primary solid CTA, secondary outline CTA, desktop/mobile image pickers, configurable section height, and vertical stack on mobile.',
  },
  {
    id: 'featured-collection-grid',
    title: '4-Column Product Grid',
    category: 'Featured Collection',
    description: 'Clean skincare best-sellers grid with color swatches and Quick Add buttons.',
    imageUrl: '/shopify-section/assets/sample_product_grid_1795368505526.jpg',
    suggestedSectionType: 'Featured Collection',
    suggestedInstructions:
      'Create a dynamic Featured Collection section connected to a Shopify collection picker. Support 2–5 columns on desktop, 1–2 columns on mobile, product swatches, show/hide vendor and price toggles, and an interactive Quick Add button.',
  },
  {
    id: 'testimonials-three-col',
    title: '3-Column Verified Testimonials',
    category: 'Testimonials',
    description: 'Customer social proof cards with 5-star ratings, quote prose, and buyer attribution.',
    imageUrl: '/shopify-section/assets/sample_testimonials_faq_1795368506390.jpg',
    suggestedSectionType: 'Testimonials',
    suggestedInstructions:
      'Generate a Testimonials section with repeatable testimonial blocks (quote, customer name, role/company, avatar image_picker, star rating 1–5, verified badge toggle) and responsive 3-column desktop / 1-column mobile grid.',
  },
];

export interface StoreCatalogItem {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  price: number;
  compare_at_price: number | null;
  available: boolean;
  url: string;
  description: string;
  featured_image: { src: string; alt: string; width: number; height: number };
  featured_media: { preview_image: { src: string; alt: string } };
  images: Array<{ src: string; alt: string }>;
  options: string[];
  variants: Array<{
    id: number;
    title: string;
    price: number;
    available: boolean;
  }>;
  metafields: {
    reviews: {
      rating: { value: { rating: number } };
      rating_count: { value: number };
    };
  };
}

function makeStudioProductSvg(
  label: string,
  accentHex: string,
  bgHex: string,
  shape: 'bottle' | 'vessel' | 'box' | 'candle'
): string {
  const shapeMarkup =
    shape === 'bottle'
      ? `<rect x="168" y="135" width="64" height="175" rx="12" fill="${accentHex}" opacity="0.9"/><rect x="184" y="102" width="32" height="36" rx="4" fill="#1E293B"/><rect x="193" y="82" width="14" height="24" rx="7" fill="#0F172A"/><rect x="176" y="180" width="48" height="72" rx="4" fill="#FFFFFF" opacity="0.92"/><line x1="184" y1="200" x2="216" y2="200" stroke="#334155" stroke-width="2"/><line x1="184" y1="214" x2="210" y2="214" stroke="#94A3B8" stroke-width="2"/>`
      : shape === 'vessel'
        ? `<path d="M155 170 C155 140, 245 140, 245 170 L232 300 C230 315, 170 315, 168 300 Z" fill="${accentHex}" opacity="0.92"/><ellipse cx="200" cy="162" rx="44" ry="12" fill="#E2E8F0"/><path d="M242 185 C270 185, 270 250, 237 250" fill="none" stroke="${accentHex}" stroke-width="10" stroke-linecap="round"/>`
        : shape === 'candle'
          ? `<rect x="152" y="165" width="96" height="145" rx="8" fill="${accentHex}" opacity="0.9"/><ellipse cx="200" cy="165" rx="48" ry="10" fill="#F8FAFC" opacity="0.85"/><line x1="200" y1="145" x2="200" y2="165" stroke="#1E293B" stroke-width="3"/><circle cx="200" cy="138" r="6" fill="#F59E0B" opacity="0.85"/>`
          : `<rect x="148" y="150" width="104" height="156" rx="10" fill="${accentHex}" opacity="0.9"/><rect x="166" y="184" width="68" height="44" rx="4" fill="#FFFFFF" opacity="0.92"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="${bgHex}"/>
    <ellipse cx="200" cy="318" rx="92" ry="16" fill="#0F172A" opacity="0.08"/>
    ${shapeMarkup}
    <text x="200" y="366" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#475569">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface StoreCatalogPreset {
  id: string;
  name: string;
  shopName: string;
  collectionTitle: string;
  collectionDescription: string;
  products: StoreCatalogItem[];
}

export const STORE_CATALOG_PRESETS: StoreCatalogPreset[] = [
  {
    id: 'skincare',
    name: 'Aura Botanicals',
    shopName: 'Aura Botanicals',
    collectionTitle: 'Best Sellers',
    collectionDescription: 'Clinically formulated daily skincare essentials crafted in small batches.',
    products: [
      {
        id: 101,
        title: 'Hydrating Vitamin C Serum',
        handle: 'hydrating-vitamin-c-serum',
        vendor: 'Aura Skin',
        price: 4800,
        compare_at_price: 5800,
        available: true,
        url: '/products/hydrating-vitamin-c-serum',
        description: 'Stabilized 15% L-ascorbic acid with hyaluronic hydration complex.',
        featured_image: {
          src: makeStudioProductSvg('Vitamin C Serum · 30ml', '#B45309', '#F4F4F5', 'bottle'),
          alt: 'Hydrating Vitamin C Serum bottle',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Vitamin C Serum · 30ml', '#B45309', '#F4F4F5', 'bottle'),
            alt: 'Hydrating Vitamin C Serum bottle',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Vitamin C Serum · 30ml', '#B45309', '#F4F4F5', 'bottle'),
            alt: 'Hydrating Vitamin C Serum bottle',
          },
        ],
        options: ['Size'],
        variants: [{ id: 1011, title: '30ml', price: 4800, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.9 } }, rating_count: { value: 142 } } },
      },
      {
        id: 102,
        title: 'Barrier Repair Ceramide Cream',
        handle: 'barrier-repair-ceramide-cream',
        vendor: 'Aura Skin',
        price: 5400,
        compare_at_price: null,
        available: true,
        url: '/products/barrier-repair-ceramide-cream',
        description: 'Rich triple-ceramide moisture barrier cream for sensitive skin.',
        featured_image: {
          src: makeStudioProductSvg('Ceramide Cream · 50ml', '#64748B', '#F1F5F9', 'box'),
          alt: 'Barrier Repair Ceramide Cream jar',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Ceramide Cream · 50ml', '#64748B', '#F1F5F9', 'box'),
            alt: 'Barrier Repair Ceramide Cream jar',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Ceramide Cream · 50ml', '#64748B', '#F1F5F9', 'box'),
            alt: 'Barrier Repair Ceramide Cream jar',
          },
        ],
        options: ['Size'],
        variants: [{ id: 1021, title: '50ml', price: 5400, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.8 } }, rating_count: { value: 98 } } },
      },
      {
        id: 103,
        title: 'Botanical Cleansing Oil',
        handle: 'botanical-cleansing-oil',
        vendor: 'Aura Skin',
        price: 3800,
        compare_at_price: null,
        available: true,
        url: '/products/botanical-cleansing-oil',
        description: 'Cold-pressed squalane and camellia oil daily gentle cleanser.',
        featured_image: {
          src: makeStudioProductSvg('Cleansing Oil · 120ml', '#0F766E', '#F0FDFA', 'bottle'),
          alt: 'Botanical Cleansing Oil',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Cleansing Oil · 120ml', '#0F766E', '#F0FDFA', 'bottle'),
            alt: 'Botanical Cleansing Oil',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Cleansing Oil · 120ml', '#0F766E', '#F0FDFA', 'bottle'),
            alt: 'Botanical Cleansing Oil',
          },
        ],
        options: ['Size'],
        variants: [{ id: 1031, title: '120ml', price: 3800, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.7 } }, rating_count: { value: 76 } } },
      },
      {
        id: 104,
        title: 'Overnight Renewal Retinol Drops',
        handle: 'overnight-renewal-retinol-drops',
        vendor: 'Aura Skin',
        price: 6200,
        compare_at_price: 7200,
        available: true,
        url: '/products/overnight-renewal-retinol-drops',
        description: 'Encapsulated 0.5% retinol treatment in soothing rosehip oil.',
        featured_image: {
          src: makeStudioProductSvg('Retinol Drops · 30ml', '#334155', '#F8FAFC', 'bottle'),
          alt: 'Overnight Renewal Retinol Drops',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Retinol Drops · 30ml', '#334155', '#F8FAFC', 'bottle'),
            alt: 'Overnight Renewal Retinol Drops',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Retinol Drops · 30ml', '#334155', '#F8FAFC', 'bottle'),
            alt: 'Overnight Renewal Retinol Drops',
          },
        ],
        options: ['Size'],
        variants: [{ id: 1041, title: '30ml', price: 6200, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.9 } }, rating_count: { value: 215 } } },
      },
    ],
  },
  {
    id: 'homeware',
    name: 'Kanso Ceramics',
    shopName: 'Kanso Ceramics',
    collectionTitle: 'Morning Rituals',
    collectionDescription: 'Wheel-thrown stoneware and pour-over vessels for mindful living.',
    products: [
      {
        id: 201,
        title: 'Travertine Pour-Over Carafe',
        handle: 'travertine-pour-over-carafe',
        vendor: 'Kanso Studio',
        price: 8400,
        compare_at_price: null,
        available: true,
        url: '/products/travertine-pour-over-carafe',
        description: 'Hand-glazed matte stoneware dripper and matching server carafe.',
        featured_image: {
          src: makeStudioProductSvg('Pour-Over Carafe', '#D6D3D1', '#F5F5F4', 'vessel'),
          alt: 'Travertine Pour-Over Carafe',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Pour-Over Carafe', '#D6D3D1', '#F5F5F4', 'vessel'),
            alt: 'Travertine Pour-Over Carafe',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Pour-Over Carafe', '#D6D3D1', '#F5F5F4', 'vessel'),
            alt: 'Travertine Pour-Over Carafe',
          },
        ],
        options: ['Finish'],
        variants: [{ id: 2011, title: 'Raw Travertine', price: 8400, available: true }],
        metafields: { reviews: { rating: { value: { rating: 5.0 } }, rating_count: { value: 64 } } },
      },
      {
        id: 202,
        title: 'Hinoki & Cedar Studio Candle',
        handle: 'hinoki-cedar-studio-candle',
        vendor: 'Kanso Studio',
        price: 4200,
        compare_at_price: null,
        available: true,
        url: '/products/hinoki-cedar-studio-candle',
        description: 'Soy and beeswax blend in a reusable matte ceramic vessel.',
        featured_image: {
          src: makeStudioProductSvg('Hinoki Candle · 240g', '#78716C', '#FAFAF9', 'candle'),
          alt: 'Hinoki & Cedar Studio Candle',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Hinoki Candle · 240g', '#78716C', '#FAFAF9', 'candle'),
            alt: 'Hinoki & Cedar Studio Candle',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Hinoki Candle · 240g', '#78716C', '#FAFAF9', 'candle'),
            alt: 'Hinoki & Cedar Studio Candle',
          },
        ],
        options: ['Scent'],
        variants: [{ id: 2021, title: 'Hinoki Wood', price: 4200, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.8 } }, rating_count: { value: 51 } } },
      },
      {
        id: 203,
        title: 'Fluted Matcha Bowl',
        handle: 'fluted-matcha-bowl',
        vendor: 'Kanso Studio',
        price: 5600,
        compare_at_price: 6400,
        available: true,
        url: '/products/fluted-matcha-bowl',
        description: 'Ergonomic stoneware chawan finished in satin slate glaze.',
        featured_image: {
          src: makeStudioProductSvg('Fluted Chawan', '#475569', '#F1F5F9', 'vessel'),
          alt: 'Fluted Matcha Bowl',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Fluted Chawan', '#475569', '#F1F5F9', 'vessel'),
            alt: 'Fluted Matcha Bowl',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Fluted Chawan', '#475569', '#F1F5F9', 'vessel'),
            alt: 'Fluted Matcha Bowl',
          },
        ],
        options: ['Color'],
        variants: [{ id: 2031, title: 'Satin Slate', price: 5600, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.9 } }, rating_count: { value: 39 } } },
      },
      {
        id: 204,
        title: 'Stoneware Tea Caddy',
        handle: 'stoneware-tea-caddy',
        vendor: 'Kanso Studio',
        price: 6800,
        compare_at_price: null,
        available: true,
        url: '/products/stoneware-tea-caddy',
        description: 'Airtight walnut-lid ceramic canister for loose leaf tea or coffee.',
        featured_image: {
          src: makeStudioProductSvg('Tea Caddy · 400ml', '#57534E', '#F5F5F4', 'box'),
          alt: 'Stoneware Tea Caddy',
          width: 800,
          height: 800,
        },
        featured_media: {
          preview_image: {
            src: makeStudioProductSvg('Tea Caddy · 400ml', '#57534E', '#F5F5F4', 'box'),
            alt: 'Stoneware Tea Caddy',
          },
        },
        images: [
          {
            src: makeStudioProductSvg('Tea Caddy · 400ml', '#57534E', '#F5F5F4', 'box'),
            alt: 'Stoneware Tea Caddy',
          },
        ],
        options: ['Size'],
        variants: [{ id: 2041, title: '400ml', price: 6800, available: true }],
        metafields: { reviews: { rating: { value: { rating: 4.7 } }, rating_count: { value: 28 } } },
      },
    ],
  },
];
