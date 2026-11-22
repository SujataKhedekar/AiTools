export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface BrandPalette {
  id: string;
  name: string;
  fgMode: 'solid' | 'gradient';
  fgColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientRotation: number;
  bgColor: string;
  cornerSquareColor: string;
  cornerDotColor: string;
  useCustomCornerColors: boolean;
}

export function normalizeHex(input: string, fallback = '#0F172A'): string {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return fallback;
}

export function isValidHex(input: string): boolean {
  const cleaned = input.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{3}$/.test(cleaned) || /^[0-9a-fA-F]{6}$/.test(cleaned);
}

export function hexToRgb(hex: string): RGBColor {
  const normalized = normalizeHex(hex).replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(Number.isFinite(v) ? v : 0)));
  const toPart = (v: number) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toPart(r)}${toPart(g)}${toPart(b)}`;
}

/**
 * WCAG 2.1 relative luminance calculation
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export const PRESET_BRAND_PALETTES: BrandPalette[] = [
  {
    id: 'obsidian-ink',
    name: 'Obsidian Ink',
    fgMode: 'solid',
    fgColor: '#0F172A',
    gradientStart: '#0F172A',
    gradientEnd: '#334155',
    gradientRotation: 135,
    bgColor: '#FFFFFF',
    cornerSquareColor: '#0F172A',
    cornerDotColor: '#2563EB',
    useCustomCornerColors: false,
  },
  {
    id: 'aivora-cobalt',
    name: 'Aivora Cobalt',
    fgMode: 'gradient',
    fgColor: '#1D4ED8',
    gradientStart: '#1E3A8A',
    gradientEnd: '#2563EB',
    gradientRotation: 135,
    bgColor: '#FFFFFF',
    cornerSquareColor: '#1E3A8A',
    cornerDotColor: '#2563EB',
    useCustomCornerColors: true,
  },
  {
    id: 'emerald-ledger',
    name: 'Emerald Studio',
    fgMode: 'gradient',
    fgColor: '#065F46',
    gradientStart: '#064E3B',
    gradientEnd: '#0D9488',
    gradientRotation: 120,
    bgColor: '#FFFFFF',
    cornerSquareColor: '#064E3B',
    cornerDotColor: '#0D9488',
    useCustomCornerColors: true,
  },
  {
    id: 'crimson-editorial',
    name: 'Crimson Press',
    fgMode: 'solid',
    fgColor: '#9F1239',
    gradientStart: '#881337',
    gradientEnd: '#E11D48',
    gradientRotation: 135,
    bgColor: '#FFF1F2',
    cornerSquareColor: '#881337',
    cornerDotColor: '#E11D48',
    useCustomCornerColors: true,
  },
  {
    id: 'luxury-brass',
    name: 'Atelier Gold',
    fgMode: 'gradient',
    fgColor: '#B45309',
    gradientStart: '#D4AF37',
    gradientEnd: '#9A6B16',
    gradientRotation: 45,
    bgColor: '#111827',
    cornerSquareColor: '#E5C158',
    cornerDotColor: '#FDE68A',
    useCustomCornerColors: true,
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    fgMode: 'gradient',
    fgColor: '#EA580C',
    gradientStart: '#C2410C',
    gradientEnd: '#DB2777',
    gradientRotation: 135,
    bgColor: '#FFFFFF',
    cornerSquareColor: '#9A3412',
    cornerDotColor: '#DB2777',
    useCustomCornerColors: true,
  },
  {
    id: 'indigo-slate',
    name: 'Indigo Slate',
    fgMode: 'gradient',
    fgColor: '#312E81',
    gradientStart: '#1E1B4B',
    gradientEnd: '#4F46E5',
    gradientRotation: 145,
    bgColor: '#F8FAFC',
    cornerSquareColor: '#1E1B4B',
    cornerDotColor: '#4F46E5',
    useCustomCornerColors: true,
  },
  {
    id: 'nordic-forest',
    name: 'Nordic Pine',
    fgMode: 'solid',
    fgColor: '#14532D',
    gradientStart: '#14532D',
    gradientEnd: '#15803D',
    gradientRotation: 135,
    bgColor: '#F0FDF4',
    cornerSquareColor: '#14532D',
    cornerDotColor: '#16A34A',
    useCustomCornerColors: true,
  },
];

/**
 * Generates a high-contrast, scannable, harmonious random brand color palette
 */
export function generateRandomPalette(): BrandPalette {
  const curatedHuePairs: Array<[number, number]> = [
    [220, 248],
    [160, 195],
    [340, 18],
    [255, 290],
    [195, 228],
    [12, 38],
    [142, 175],
    [275, 325],
    [205, 175],
    [350, 295],
  ];

  const [hue1, hue2] = curatedHuePairs[Math.floor(Math.random() * curatedHuePairs.length)];
  const useDarkBg = Math.random() < 0.22;
  const useGradient = Math.random() < 0.65;

  const hslToHex = (h: number, s: number, l: number): string => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  };

  if (useDarkBg) {
    const bgColor = hslToHex(hue1, 28, 9);
    const start = hslToHex(hue1, 82, 66);
    const end = hslToHex(hue2, 85, 62);
    return {
      id: `random-${Date.now()}`,
      name: 'Generated Dark',
      fgMode: useGradient ? 'gradient' : 'solid',
      fgColor: start,
      gradientStart: start,
      gradientEnd: end,
      gradientRotation: [45, 90, 135, 180][Math.floor(Math.random() * 4)],
      bgColor,
      cornerSquareColor: start,
      cornerDotColor: end,
      useCustomCornerColors: true,
    };
  }

  const start = hslToHex(hue1, 72, 26);
  const end = hslToHex(hue2, 74, 40);
  const tintBg = Math.random() < 0.3 ? hslToHex(hue1, 35, 98) : '#FFFFFF';
  return {
    id: `random-${Date.now()}`,
    name: 'Generated Light',
    fgMode: useGradient ? 'gradient' : 'solid',
    fgColor: start,
    gradientStart: start,
    gradientEnd: end,
    gradientRotation: [45, 90, 125, 135, 160][Math.floor(Math.random() * 5)],
    bgColor: tintBg,
    cornerSquareColor: start,
    cornerDotColor: end,
    useCustomCornerColors: Math.random() < 0.7,
  };
}
