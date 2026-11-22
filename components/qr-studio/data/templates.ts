import {
  CornerDotStyle,
  CornerSquareStyle,
  DesignTemplate,
  FramePresetId,
  QRStyleConfig,
} from '../types/qr';

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  fgMode: 'solid',
  fgColor: '#0F172A',
  gradientType: 'linear',
  gradientStart: '#1E3A8A',
  gradientEnd: '#2563EB',
  gradientRotation: 135,
  bgColor: '#FFFFFF',
  bgTransparent: false,

  moduleStyle: 'rounded',
  quietZone: 3,

  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  useCustomCornerColors: false,
  cornerSquareColor: '#0F172A',
  cornerDotColor: '#2563EB',

  logoDataUrl: null,
  logoFileName: null,
  logoSize: 22,
  logoPadding: 8,
  logoBgEnabled: true,
  logoBgColor: '#FFFFFF',
  logoShape: 'rounded',
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoExcavate: true,

  framePreset: 'none',
  frameStyle: 'banner',
  frameText: 'SCAN ME',
  frameColor: '#0F172A',
  frameTextColor: '#FFFFFF',
  frameFontSize: 20,
  frameFontWeight: 700,
  framePosition: 'bottom',
  frameRadius: 16,

  errorCorrection: 'M',
  autoErrorCorrection: true,
};

export interface FramePresetOption {
  id: FramePresetId;
  label: string;
  defaultText: string;
}

export const FRAME_PRESETS: FramePresetOption[] = [
  { id: 'none', label: 'No Frame', defaultText: '' },
  { id: 'scan-me', label: 'Scan Me', defaultText: 'SCAN ME' },
  { id: 'scan-here', label: 'Scan Here', defaultText: 'SCAN HERE' },
  { id: 'open-website', label: 'Open Website', defaultText: 'OPEN WEBSITE' },
  { id: 'visit-us', label: 'Visit Us', defaultText: 'VISIT US' },
  { id: 'follow-us', label: 'Follow Us', defaultText: 'FOLLOW US' },
  { id: 'custom', label: 'Custom Text', defaultText: 'EXPLORE NOW' },
];

export interface CornerPreset {
  id: string;
  name: string;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
}

export const CORNER_PRESETS: CornerPreset[] = [
  { id: 'classic', name: 'Classic', cornerSquareStyle: 'square', cornerDotStyle: 'square' },
  { id: 'soft', name: 'Soft Modern', cornerSquareStyle: 'extra-rounded', cornerDotStyle: 'dot' },
  { id: 'circular', name: 'Circular Eye', cornerSquareStyle: 'dot', cornerDotStyle: 'dot' },
  { id: 'editorial', name: 'Editorial Leaf', cornerSquareStyle: 'leaf', cornerDotStyle: 'classy' },
  { id: 'diamond', name: 'Sharp Diamond', cornerSquareStyle: 'rounded', cornerDotStyle: 'diamond' },
  { id: 'classy', name: 'Classy Arch', cornerSquareStyle: 'classy', cornerDotStyle: 'rounded' },
];

/**
 * 14 Ready-Made Professional QR Code Design Templates
 */
export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'minimal-bw',
    name: 'Minimal Black & White',
    category: 'Minimal',
    description: 'Razor-sharp monochrome with architectural proportions.',
    previewSwatches: ['#09090B', '#FFFFFF', '#09090B'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#09090B',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
      useCustomCornerColors: false,
      framePreset: 'none',
      quietZone: 3,
    },
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    category: 'Digital',
    description: 'Deep cobalt to sapphire gradient with organic modules.',
    previewSwatches: ['#1E3A8A', '#2563EB', '#FFFFFF'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#1E3A8A',
      gradientEnd: '#0EA5E9',
      gradientRotation: 135,
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      useCustomCornerColors: true,
      cornerSquareColor: '#1E3A8A',
      cornerDotColor: '#0284C7',
      framePreset: 'scan-me',
      frameStyle: 'banner',
      frameText: 'SCAN ME',
      frameColor: '#1E3A8A',
      frameTextColor: '#FFFFFF',
      frameRadius: 18,
    },
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    category: 'Hospitality',
    description: 'Brushed champagne gold set on matte obsidian.',
    previewSwatches: ['#D4AF37', '#111318', '#F5D67B'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#E6C25A',
      gradientEnd: '#A9781D',
      gradientRotation: 45,
      bgColor: '#111318',
      bgTransparent: false,
      moduleStyle: 'classy-rounded',
      cornerSquareStyle: 'leaf',
      cornerDotStyle: 'diamond',
      useCustomCornerColors: true,
      cornerSquareColor: '#E6C25A',
      cornerDotColor: '#FDE68A',
      framePreset: 'visit-us',
      frameStyle: 'outline',
      frameText: 'PRIVATE ACCESS',
      frameColor: '#D4AF37',
      frameTextColor: '#111318',
      frameRadius: 12,
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Enterprise',
    description: 'Structured navy and slate engineered for B2B collateral.',
    previewSwatches: ['#0F294A', '#1D4ED8', '#F8FAFC'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#0F294A',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'rounded',
      cornerSquareStyle: 'rounded',
      cornerDotStyle: 'rounded',
      useCustomCornerColors: true,
      cornerSquareColor: '#0F294A',
      cornerDotColor: '#1D4ED8',
      framePreset: 'open-website',
      frameStyle: 'card',
      frameText: 'OPEN WEBSITE',
      frameColor: '#0F294A',
      frameTextColor: '#FFFFFF',
      frameRadius: 14,
    },
  },
  {
    id: 'creative-colorful',
    name: 'Creative Colorful',
    category: 'Creative',
    description: 'Vivid coral-to-violet gradient with vertical bar rhythm.',
    previewSwatches: ['#EA580C', '#9333EA', '#FFFFFF'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#EA580C',
      gradientEnd: '#9333EA',
      gradientRotation: 125,
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'vertical-bars',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      useCustomCornerColors: true,
      cornerSquareColor: '#9333EA',
      cornerDotColor: '#EA580C',
      framePreset: 'scan-here',
      frameStyle: 'pill',
      frameText: 'SCAN HERE',
      frameColor: '#9333EA',
      frameTextColor: '#FFFFFF',
      frameRadius: 24,
    },
  },
  {
    id: 'neon-style',
    name: 'Neon Style',
    category: 'Nightlife',
    description: 'Electric cyan-emerald luminescence on deep midnight ink.',
    previewSwatches: ['#22D3EE', '#090D16', '#34D399'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#22D3EE',
      gradientEnd: '#34D399',
      gradientRotation: 90,
      bgColor: '#090D16',
      bgTransparent: false,
      moduleStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
      useCustomCornerColors: true,
      cornerSquareColor: '#22D3EE',
      cornerDotColor: '#34D399',
      framePreset: 'scan-me',
      frameStyle: 'banner',
      frameText: 'SCAN ME',
      frameColor: '#22D3EE',
      frameTextColor: '#090D16',
      frameRadius: 16,
    },
  },
  {
    id: 'minimal-dotted',
    name: 'Minimal Dotted',
    category: 'Minimal',
    description: 'Airy precision dot matrix in soft charcoal.',
    previewSwatches: ['#1E293B', '#FFFFFF', '#64748B'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#1E293B',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
      useCustomCornerColors: false,
      framePreset: 'none',
      quietZone: 4,
    },
  },
  {
    id: 'rounded-modern',
    name: 'Rounded Modern',
    category: 'Product',
    description: 'Friendly horizontal bars and smooth pill-radius corners.',
    previewSwatches: ['#0F766E', '#F0FDFA', '#115E59'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#0F766E',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'horizontal-bars',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'rounded',
      useCustomCornerColors: true,
      cornerSquareColor: '#115E59',
      cornerDotColor: '#14B8A6',
      framePreset: 'scan-me',
      frameStyle: 'pill',
      frameText: 'SCAN ME',
      frameColor: '#0F766E',
      frameTextColor: '#FFFFFF',
      frameRadius: 24,
    },
  },
  {
    id: 'instagram-branding',
    name: 'Instagram Branding',
    category: 'Social',
    description: 'Warm magenta-to-amber sunset gradient built for creator handles.',
    previewSwatches: ['#C026D3', '#F97316', '#FFFFFF'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#A21CAF',
      gradientEnd: '#F97316',
      gradientRotation: 45,
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      useCustomCornerColors: true,
      cornerSquareColor: '#BE185D',
      cornerDotColor: '#EA580C',
      framePreset: 'follow-us',
      frameStyle: 'banner',
      frameText: 'FOLLOW US',
      frameColor: '#BE185D',
      frameTextColor: '#FFFFFF',
      frameRadius: 20,
    },
  },
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    category: 'Hospitality',
    description: 'Warm espresso ink on parchment white for table tents.',
    previewSwatches: ['#451A03', '#FFFBEB', '#9A3412'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#451A03',
      bgColor: '#FFFBEB',
      bgTransparent: false,
      moduleStyle: 'classy',
      cornerSquareStyle: 'leaf',
      cornerDotStyle: 'rounded',
      useCustomCornerColors: true,
      cornerSquareColor: '#7C2D12',
      cornerDotColor: '#B45309',
      framePreset: 'custom',
      frameStyle: 'card',
      frameText: 'VIEW MENU',
      frameColor: '#451A03',
      frameTextColor: '#FEF3C7',
      frameRadius: 14,
    },
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'Professional',
    description: 'High-density slate charcoal tailored for vCard print stock.',
    previewSwatches: ['#18181B', '#FFFFFF', '#3F3F46'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#18181B',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'classy-rounded',
      cornerSquareStyle: 'classy',
      cornerDotStyle: 'square',
      useCustomCornerColors: true,
      cornerSquareColor: '#18181B',
      cornerDotColor: '#52525B',
      framePreset: 'custom',
      frameStyle: 'outline',
      frameText: 'SAVE CONTACT',
      frameColor: '#18181B',
      frameTextColor: '#FFFFFF',
      frameRadius: 10,
    },
  },
  {
    id: 'event-qr',
    name: 'Event QR Code',
    category: 'Events',
    description: 'High-visibility royal violet for badges, passes, and check-ins.',
    previewSwatches: ['#4338CA', '#FFFFFF', '#6366F1'],
    stylePatch: {
      fgMode: 'gradient',
      gradientType: 'linear',
      gradientStart: '#312E81',
      gradientEnd: '#6366F1',
      gradientRotation: 135,
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'rounded',
      cornerSquareStyle: 'rounded',
      cornerDotStyle: 'diamond',
      useCustomCornerColors: true,
      cornerSquareColor: '#312E81',
      cornerDotColor: '#4F46E5',
      framePreset: 'custom',
      frameStyle: 'banner',
      frameText: 'EVENT CHECK-IN',
      frameColor: '#312E81',
      frameTextColor: '#FFFFFF',
      frameRadius: 16,
    },
  },
  {
    id: 'ecommerce-product',
    name: 'E-commerce Product',
    category: 'Retail',
    description: 'Crisp emerald conversion styling for packaging inserts.',
    previewSwatches: ['#065F46', '#FFFFFF', '#059669'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#065F46',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'rounded',
      useCustomCornerColors: true,
      cornerSquareColor: '#064E3B',
      cornerDotColor: '#059669',
      framePreset: 'custom',
      frameStyle: 'pill',
      frameText: 'SHOP ONLINE',
      frameColor: '#065F46',
      frameTextColor: '#FFFFFF',
      frameRadius: 22,
    },
  },
  {
    id: 'real-estate',
    name: 'Real Estate Branding',
    category: 'Property',
    description: 'Architectural forest green and warm stone for yard signs.',
    previewSwatches: ['#1B4332', '#F8F9FA', '#40916C'],
    stylePatch: {
      fgMode: 'solid',
      fgColor: '#1B4332',
      bgColor: '#FFFFFF',
      bgTransparent: false,
      moduleStyle: 'square',
      cornerSquareStyle: 'classy',
      cornerDotStyle: 'square',
      useCustomCornerColors: true,
      cornerSquareColor: '#1B4332',
      cornerDotColor: '#2D6A4F',
      framePreset: 'visit-us',
      frameStyle: 'card',
      frameText: 'PROPERTY TOUR',
      frameColor: '#1B4332',
      frameTextColor: '#FFFFFF',
      frameRadius: 12,
    },
  },
];

/**
 * Clean built-in vector mark options for rapid previewing alongside user uploads
 */
export interface SampleLogoAsset {
  id: string;
  name: string;
  dataUrl: string;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_LOGO_MARKS: SampleLogoAsset[] = [
  {
    id: 'aivora-mark',
    name: 'Aivora',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#0F172A"/>
        <path d="M32 14L48 48H40.5L37.2 40.5H26.8L23.5 48H16L32 14ZM34.8 34.8L32 28.2L29.2 34.8H34.8Z" fill="#FFFFFF"/>
        <circle cx="32" cy="18" r="2.5" fill="#3B82F6"/>
      </svg>
    `),
  },
  {
    id: 'wifi-mark',
    name: 'Wi-Fi',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#1D4ED8"/>
        <path d="M14 26C24 16 40 16 50 26" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <path d="M21 34C27 28 37 28 43 34" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <circle cx="32" cy="44" r="4.2" fill="#FFFFFF"/>
      </svg>
    `),
  },
  {
    id: 'shop-mark',
    name: 'Store',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#065F46"/>
        <path d="M20 24H44L47 48H17L20 24Z" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" fill="none"/>
        <path d="M25 24V21C25 17.1 28.1 14 32 14C35.9 14 39 17.1 39 21V24" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none"/>
      </svg>
    `),
  },
  {
    id: 'pin-mark',
    name: 'Map Pin',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#BE123C"/>
        <path d="M32 50C32 50 45 38.2 45 27C45 19.8 39.2 14 32 14C24.8 14 19 19.8 19 27C19 38.2 32 50 32 50Z" fill="#FFFFFF"/>
        <circle cx="32" cy="27" r="5" fill="#BE123C"/>
      </svg>
    `),
  },
];
