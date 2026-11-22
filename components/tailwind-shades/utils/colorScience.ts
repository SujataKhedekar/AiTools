import {
  ColourAdjustments,
  ColourFormat,
  GenerationMode,
  HarmonyColour,
  HarmonyKind,
  HSL,
  OKLCH,
  PresetColour,
  RGB,
  SHADE_LEVELS,
  ShadeEntry,
  ShadeLevel,
} from '../types/palette';

/**
 * Standard 20 Tailwind CSS preset colours.
 */
export const PRESET_COLOURS: PresetColour[] = [
  { name: 'Blue', slug: 'blue', hex: '#3B82F6', family: 'cool' },
  { name: 'Sky', slug: 'sky', hex: '#0EA5E9', family: 'cool' },
  { name: 'Indigo', slug: 'indigo', hex: '#6366F1', family: 'cool' },
  { name: 'Violet', slug: 'violet', hex: '#8B5CF6', family: 'cool' },
  { name: 'Purple', slug: 'purple', hex: '#A855F7', family: 'cool' },
  { name: 'Pink', slug: 'pink', hex: '#EC4899', family: 'warm' },
  { name: 'Rose', slug: 'rose', hex: '#F43F5E', family: 'warm' },
  { name: 'Red', slug: 'red', hex: '#EF4444', family: 'warm' },
  { name: 'Orange', slug: 'orange', hex: '#F97316', family: 'warm' },
  { name: 'Amber', slug: 'amber', hex: '#F59E0B', family: 'warm' },
  { name: 'Yellow', slug: 'yellow', hex: '#EAB308', family: 'warm' },
  { name: 'Lime', slug: 'lime', hex: '#84CC16', family: 'warm' },
  { name: 'Green', slug: 'green', hex: '#22C55E', family: 'cool' },
  { name: 'Emerald', slug: 'emerald', hex: '#10B981', family: 'cool' },
  { name: 'Teal', slug: 'teal', hex: '#14B8A6', family: 'cool' },
  { name: 'Cyan', slug: 'cyan', hex: '#06B6D4', family: 'cool' },
  { name: 'Slate', slug: 'slate', hex: '#64748B', family: 'neutral' },
  { name: 'Gray', slug: 'gray', hex: '#6B7280', family: 'neutral' },
  { name: 'Zinc', slug: 'zinc', hex: '#71717A', family: 'neutral' },
  { name: 'Neutral', slug: 'neutral', hex: '#737373', family: 'neutral' },
];

export const GENERATION_MODES: {
  id: GenerationMode;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: 'classic',
    label: 'Classic',
    shortDesc: 'Balanced Tailwind-style perceptual curve',
  },
  {
    id: 'hue-shift',
    label: 'Hue Shift',
    shortDesc: 'Gradual Bezold-Brücke hue rotation across shades',
  },
  {
    id: 'luminance',
    label: 'Luminance',
    shortDesc: 'Strict perceptual lightness steps, fixed hue',
  },
  {
    id: 'vivid',
    label: 'Vivid',
    shortDesc: 'High-chroma saturated highlights and deep shadows',
  },
  {
    id: 'muted',
    label: 'Muted',
    shortDesc: 'Refined editorial scale with softened chroma',
  },
];

// ---------------------------------------------------------------------------
// HEX Validation & Normalization
// ---------------------------------------------------------------------------

export function normalizeHex(input: string): string | null {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return null;
}

export function validateHexInput(input: string): {
  valid: boolean;
  normalized: string | null;
  error: string | null;
} {
  const raw = input.trim();
  if (!raw) {
    return { valid: false, normalized: null, error: 'Enter a 3- or 6-digit HEX colour (e.g. #3B82F6).' };
  }
  const stripped = raw.replace(/^#/, '');
  if (!/^[0-9a-fA-F]*$/.test(stripped)) {
    return {
      valid: false,
      normalized: null,
      error: 'HEX codes only accept characters 0–9 and A–F.',
    };
  }
  if (stripped.length !== 3 && stripped.length !== 6) {
    return {
      valid: false,
      normalized: null,
      error: `Expected 3 or 6 hex characters (currently ${stripped.length}).`,
    };
  }
  return { valid: true, normalized: normalizeHex(raw), error: null };
}

export function sanitizeSlug(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'primary';
}

// ---------------------------------------------------------------------------
// Colour Space Conversions: sRGB <-> Linear RGB <-> OKLab <-> OKLCH & HSL
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string): RGB {
  const norm = normalizeHex(hex) ?? '#3B82F6';
  const num = parseInt(norm.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(v: number): number {
  const clamped = Math.max(0, Math.min(1, v));
  const s =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      case bn:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }
  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return {
    l: Math.max(0, Math.min(1, L)),
    c: Math.max(0, C),
    h: Number.isFinite(H) ? H : 0,
  };
}

function oklchToLinearRgbRaw(oklch: OKLCH): { r: number; g: number; b: number } {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);

  const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = oklch.l - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function isInLinearSrgbGamut(lin: { r: number; g: number; b: number }): boolean {
  const eps = 0.0005;
  return (
    lin.r >= -eps &&
    lin.r <= 1 + eps &&
    lin.g >= -eps &&
    lin.g <= 1 + eps &&
    lin.b >= -eps &&
    lin.b <= 1 + eps
  );
}

/**
 * Finds the maximum sRGB-displayable chroma for a given OKLCH lightness & hue.
 */
export function maxSrgbChroma(l: number, h: number): number {
  const clampedL = Math.max(0.001, Math.min(0.999, l));
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (isInLinearSrgbGamut(oklchToLinearRgbRaw({ l: clampedL, c: mid, h }))) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Converts OKLCH to sRGB with perceptually accurate chroma gamut clamping
 * so hues never distort when approaching near-white or near-black.
 */
export function oklchToRgb(oklch: OKLCH, gamutClamp = true): RGB {
  const L = Math.max(0, Math.min(1, oklch.l));
  const H = ((oklch.h % 360) + 360) % 360;
  let C = Math.max(0, oklch.c);

  let lin = oklchToLinearRgbRaw({ l: L, c: C, h: H });
  if (gamutClamp && !isInLinearSrgbGamut(lin)) {
    const maxC = maxSrgbChroma(L, H);
    C = Math.min(C, maxC);
    lin = oklchToLinearRgbRaw({ l: L, c: C, h: H });
  }

  return {
    r: linearChannelToSrgb(lin.r),
    g: linearChannelToSrgb(lin.g),
    b: linearChannelToSrgb(lin.b),
  };
}

export function oklchToHex(oklch: OKLCH, gamutClamp = true): string {
  return rgbToHex(oklchToRgb(oklch, gamutClamp));
}

export function hexToOklch(hex: string): OKLCH {
  return rgbToOklch(hexToRgb(hex));
}

// ---------------------------------------------------------------------------
// WCAG 2.1 Relative Luminance & Contrast Calculations
// ---------------------------------------------------------------------------

export function relativeLuminance(rgb: RGB): number {
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagGrade(ratio: number): {
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  label: 'AAA' | 'AA' | 'AA Large' | 'Fail';
} {
  const normalAAA = ratio >= 7;
  const normalAA = ratio >= 4.5;
  const largeAAA = ratio >= 4.5;
  const largeAA = ratio >= 3;
  const label = normalAAA
    ? 'AAA'
    : normalAA
      ? 'AA'
      : largeAA
        ? 'AA Large'
        : 'Fail';
  return { normalAA, normalAAA, largeAA, largeAAA, label };
}

export function getReadableTextColor(bgHex: string): '#FFFFFF' | '#08100C' {
  const cWhite = contrastRatio(bgHex, '#FFFFFF');
  const cDark = contrastRatio(bgHex, '#08100C');
  return cWhite >= cDark ? '#FFFFFF' : '#08100C';
}

// ---------------------------------------------------------------------------
// Formatting Utilities
// ---------------------------------------------------------------------------

export function formatColour(
  entry: Pick<ShadeEntry, 'hex' | 'rgb' | 'hsl' | 'oklch'>,
  format: ColourFormat,
  uppercaseHex = true
): string {
  switch (format) {
    case 'hex':
      return uppercaseHex ? entry.hex.toUpperCase() : entry.hex.toLowerCase();
    case 'rgb':
      return `rgb(${entry.rgb.r}, ${entry.rgb.g}, ${entry.rgb.b})`;
    case 'hsl':
      return `hsl(${entry.hsl.h}, ${entry.hsl.s}%, ${entry.hsl.l}%)`;
    case 'oklch':
      return `oklch(${(entry.oklch.l * 100).toFixed(1)}% ${entry.oklch.c.toFixed(3)} ${Math.round(entry.oklch.h)})`;
  }
}

export function buildShadeEntry(
  level: ShadeLevel,
  hex: string,
  meta?: {
    locked?: boolean;
    isEdited?: boolean;
    customLightnessOffset?: number;
  }
): ShadeEntry {
  const norm = normalizeHex(hex) ?? '#3B82F6';
  const rgb = hexToRgb(norm);
  const hsl = rgbToHsl(rgb);
  const oklch = rgbToOklch(rgb);
  return {
    level,
    hex: norm,
    rgb,
    hsl,
    oklch,
    contrastWhite: contrastRatio(norm, '#FFFFFF'),
    contrastDark: contrastRatio(norm, '#08100C'),
    locked: meta?.locked ?? false,
    isEdited: meta?.isEdited ?? false,
    customLightnessOffset: meta?.customLightnessOffset ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Core 50–950 Shade Scale Generation Algorithms (5 Distinct Colour Models)
// ---------------------------------------------------------------------------

/** Target OKLCH lightness anchors modeled closely after Tailwind v4 perceptually uniform scales */
const CLASSIC_LIGHTNESS: Record<ShadeLevel, number> = {
  50: 0.972,
  100: 0.935,
  200: 0.868,
  300: 0.778,
  400: 0.678,
  500: 0.585,
  600: 0.495,
  700: 0.415,
  800: 0.342,
  900: 0.278,
  950: 0.205,
};

/** Bell-curve chroma multipliers across shade steps */
const CLASSIC_CHROMA_CURVE: Record<ShadeLevel, number> = {
  50: 0.14,
  100: 0.28,
  200: 0.52,
  300: 0.78,
  400: 0.94,
  500: 1.0,
  600: 1.03,
  700: 0.96,
  800: 0.84,
  900: 0.72,
  950: 0.56,
};

/** Normalized position -1 (50) to +1 (950), with 0 at 500 */
const STEP_OFFSET: Record<ShadeLevel, number> = {
  50: -1.0,
  100: -0.8,
  200: -0.6,
  300: -0.4,
  400: -0.2,
  500: 0,
  600: 0.2,
  700: 0.4,
  800: 0.6,
  900: 0.8,
  950: 1.0,
};

function applyBaseAdjustments(
  base: OKLCH,
  adjustments: ColourAdjustments
): OKLCH {
  // Temperature shifts hue softly toward warm amber (~75°) or cool cobalt (~240°)
  const temp = adjustments.temperature; // -30..30
  let hue = base.h;
  if (temp !== 0) {
    const targetHue = temp > 0 ? 75 : 235;
    let delta = ((targetHue - base.h + 540) % 360) - 180;
    // Blend up to 28 degrees toward target warmth/coolness
    hue = (base.h + (delta * Math.abs(temp)) / 85 + 360) % 360;
  }

  // Saturation multiplier
  const satMult = Math.max(0.05, 1 + adjustments.saturation / 100);
  const chroma = Math.max(0, Math.min(0.36, base.c * satMult));

  // Brightness shift
  const lightShift = adjustments.brightness / 100;
  const lightness = Math.max(0.12, Math.min(0.95, base.l + lightShift));

  return { l: lightness, c: chroma, h: hue };
}

/**
 * Generates a full 11-shade (50–950) palette using genuine OKLCH colour science.
 */
export function generatePaletteScale(params: {
  baseHex: string;
  mode: GenerationMode;
  adjustments: ColourAdjustments;
  anchorBaseAt500: boolean;
  gamutClamp: boolean;
  existingShades?: ShadeEntry[];
}): ShadeEntry[] {
  const {
    baseHex,
    mode,
    adjustments,
    anchorBaseAt500,
    gamutClamp,
    existingShades,
  } = params;

  const rawBaseOklch = hexToOklch(baseHex);
  const adjustedBase = applyBaseAdjustments(rawBaseOklch, adjustments);
  const isNeutralBase = adjustedBase.c < 0.022;
  const hasNoAdjustments =
    adjustments.temperature === 0 &&
    adjustments.saturation === 0 &&
    adjustments.brightness === 0;

  // Determine how far the base colour's natural lightness sits from 500's standard 0.585
  const anchorDelta = adjustedBase.l - CLASSIC_LIGHTNESS[500];

  return SHADE_LEVELS.map((level) => {
    const prev = existingShades?.find((s) => s.level === level);
    if (prev?.locked) {
      return prev;
    }

    const stepPos = STEP_OFFSET[level]; // -1..+1
    const userOffset = prev?.customLightnessOffset ?? 0;

    // If user keeps 500 anchored and has no slider/curve offsets, honour exact base HEX at 500
    if (
      level === 500 &&
      anchorBaseAt500 &&
      hasNoAdjustments &&
      userOffset === 0 &&
      mode !== 'muted' &&
      mode !== 'vivid'
    ) {
      return buildShadeEntry(500, baseHex, {
        locked: false,
        isEdited: false,
        customLightnessOffset: 0,
      });
    }

    // 1. Compute target Lightness based on mode
    let targetL = CLASSIC_LIGHTNESS[level];
    const weight = 1 - Math.abs(stepPos); // 1 at 500, 0 at extremes 50 & 950

    if (mode === 'luminance') {
      // Strict evenly spaced perceptual lightness ladder from 0.975 down to 0.175
      const index = SHADE_LEVELS.indexOf(level);
      targetL = 0.975 - (index / (SHADE_LEVELS.length - 1)) * 0.79;
      targetL += (adjustments.brightness / 100) * (0.4 + 0.6 * weight);
    } else if (mode === 'classic') {
      // Smoothly pull mid-tones toward the base colour's natural lightness while keeping extremes clean
      targetL = targetL + anchorDelta * Math.pow(weight, 1.35) * 0.78;
    } else if (mode === 'hue-shift') {
      targetL = targetL + anchorDelta * Math.pow(weight, 1.4) * 0.72;
    } else if (mode === 'vivid') {
      // Slightly richer mid-range luminance so high-chroma tones pop cleanly
      targetL = targetL + anchorDelta * Math.pow(weight, 1.3) * 0.65 - 0.012 * weight;
    } else if (mode === 'muted') {
      // Softened contrast envelope for refined editorial palettes
      targetL = 0.962 - ((0.972 - targetL) / (0.972 - 0.205)) * 0.73;
      targetL = targetL + anchorDelta * Math.pow(weight, 1.5) * 0.55;
    }

    targetL = Math.max(0.09, Math.min(0.985, targetL + userOffset));

    // 2. Compute target Hue based on mode
    let targetH = adjustedBase.h;
    if (mode === 'hue-shift' && !isNeutralBase) {
      // Perceptual Bezold-Brücke shift: lighter shades drift slightly warmer (+14°),
      // darker shades drift cooler/deeper (-18°) for natural atmospheric shading
      const warmDirection = adjustedBase.h > 40 && adjustedBase.h < 220 ? -1 : 1;
      const shiftDeg = stepPos * 19 * warmDirection;
      targetH = (adjustedBase.h + shiftDeg + 360) % 360;
    } else if (mode === 'classic' && !isNeutralBase) {
      // Very subtle 3° natural hue stabilization at deep shadows
      const microShift = stepPos > 0 ? stepPos * 3.5 : stepPos * 2;
      targetH = (adjustedBase.h + microShift + 360) % 360;
    }

    // 3. Compute target Chroma based on mode
    let targetC = adjustedBase.c * CLASSIC_CHROMA_CURVE[level];

    if (mode === 'luminance') {
      // Constant relative chroma fraction of the displayable sRGB gamut at each lightness
      const baseMaxC = Math.max(0.01, maxSrgbChroma(adjustedBase.l, adjustedBase.h));
      const relativeSat = Math.min(1, adjustedBase.c / baseMaxC);
      const stepMaxC = maxSrgbChroma(targetL, targetH);
      targetC = stepMaxC * relativeSat * (level === 50 ? 0.55 : level === 950 ? 0.72 : 0.94);
    } else if (mode === 'vivid') {
      const stepMaxC = maxSrgbChroma(targetL, targetH);
      const boosted = isNeutralBase
        ? adjustedBase.c * 1.4
        : Math.max(adjustedBase.c * 1.24, stepMaxC * 0.88);
      const vividCurve =
        level === 50
          ? 0.22
          : level === 100
            ? 0.42
            : level === 200
              ? 0.68
              : level === 950
                ? 0.72
                : Math.min(1.08, CLASSIC_CHROMA_CURVE[level] * 1.12);
      targetC = Math.min(stepMaxC * 0.98, boosted * vividCurve);
    } else if (mode === 'muted') {
      targetC = adjustedBase.c * CLASSIC_CHROMA_CURVE[level] * 0.52;
    } else if (mode === 'hue-shift') {
      targetC = adjustedBase.c * CLASSIC_CHROMA_CURVE[level] * 1.04;
    }

    const hex = oklchToHex({ l: targetL, c: targetC, h: targetH }, gamutClamp);
    return buildShadeEntry(level, hex, {
      locked: false,
      isEdited: Math.abs(userOffset) > 0.001,
      customLightnessOffset: userOffset,
    });
  });
}

// ---------------------------------------------------------------------------
// Colour Harmonies & Random Palette Generator
// ---------------------------------------------------------------------------

export function generateHarmony(
  baseHex: string,
  kind: HarmonyKind
): HarmonyColour[] {
  const base = hexToOklch(baseHex);
  const shift = (deg: number, lMod = 0, cMult = 1): string => {
    const h = (base.h + deg + 360) % 360;
    const l = Math.max(0.18, Math.min(0.92, base.l + lMod));
    const c = Math.max(0.01, Math.min(0.32, base.c * cMult));
    return oklchToHex({ l, c, h }, true);
  };

  switch (kind) {
    case 'complementary':
      return [
        { label: 'Base', angle: '0°', hex: normalizeHex(baseHex) ?? baseHex, role: 'Primary anchor' },
        { label: 'Complement', angle: '+180°', hex: shift(180), role: 'High-contrast accent' },
        { label: 'Soft Tint', angle: '0°', hex: shift(0, 0.2, 0.55), role: 'Light surface accent' },
        { label: 'Complement Deep', angle: '+180°', hex: shift(180, -0.16, 0.9), role: 'Dark emphasis' },
      ];
    case 'analogous':
      return [
        { label: 'Cool Neighbor', angle: '-30°', hex: shift(-30), role: 'Secondary support' },
        { label: 'Near Left', angle: '-15°', hex: shift(-15, 0.04), role: 'Subtle blend' },
        { label: 'Base', angle: '0°', hex: normalizeHex(baseHex) ?? baseHex, role: 'Primary anchor' },
        { label: 'Near Right', angle: '+15°', hex: shift(15, -0.03), role: 'Hover / highlight' },
        { label: 'Warm Neighbor', angle: '+30°', hex: shift(30), role: 'Tertiary accent' },
      ];
    case 'triadic':
      return [
        { label: 'Base', angle: '0°', hex: normalizeHex(baseHex) ?? baseHex, role: 'Primary brand' },
        { label: 'Triad II', angle: '+120°', hex: shift(120), role: 'Secondary accent' },
        { label: 'Triad III', angle: '+240°', hex: shift(240), role: 'Tertiary highlight' },
      ];
    case 'split-complementary':
      return [
        { label: 'Base', angle: '0°', hex: normalizeHex(baseHex) ?? baseHex, role: 'Primary brand' },
        { label: 'Split Left', angle: '+150°', hex: shift(150), role: 'Balanced contrast A' },
        { label: 'Split Right', angle: '+210°', hex: shift(210), role: 'Balanced contrast B' },
      ];
    case 'monochromatic':
      return [
        { label: 'Highlight', angle: '0°', hex: shift(0, 0.28, 0.45), role: 'Surface highlight' },
        { label: 'Light Tone', angle: '0°', hex: shift(0, 0.14, 0.78), role: 'Interactive tint' },
        { label: 'Base', angle: '0°', hex: normalizeHex(baseHex) ?? baseHex, role: 'Primary anchor' },
        { label: 'Deep Tone', angle: '0°', hex: shift(0, -0.14, 0.92), role: 'Pressed state' },
        { label: 'Shadow', angle: '0°', hex: shift(0, -0.28, 0.72), role: 'Dark surface' },
      ];
  }
}

const RANDOM_NAMES: { minHue: number; maxHue: number; names: string[] }[] = [
  { minHue: 0, maxHue: 25, names: ['crimson', 'coral', 'vermilion', 'rosewood'] },
  { minHue: 25, maxHue: 55, names: ['amber', 'terracotta', 'marigold', 'ochre'] },
  { minHue: 55, maxHue: 95, names: ['citrine', 'sunbeam', 'olive', 'saffron'] },
  { minHue: 95, maxHue: 155, names: ['emerald', 'jade', 'fern', 'pine'] },
  { minHue: 155, maxHue: 205, names: ['teal', 'lagoon', 'glacier', 'spruce'] },
  { minHue: 205, maxHue: 255, names: ['azure', 'cobalt', 'cerulean', 'ocean'] },
  { minHue: 255, maxHue: 300, names: ['indigo', 'iris', 'amethyst', 'dusk'] },
  { minHue: 300, maxHue: 360, names: ['orchid', 'berry', 'magenta', 'plum'] },
];

export function generateRandomColour(): {
  hex: string;
  colourName: string;
  paletteName: string;
} {
  const hue = Math.floor(Math.random() * 360);
  const lightness = 0.5 + Math.random() * 0.22; // 0.50..0.72 sweet spot for Tailwind 500
  const maxC = maxSrgbChroma(lightness, hue);
  const chroma = maxC * (0.55 + Math.random() * 0.4);
  const hex = oklchToHex({ l: lightness, c: chroma, h: hue }, true);

  const bucket =
    RANDOM_NAMES.find((b) => hue >= b.minHue && hue < b.maxHue) ?? RANDOM_NAMES[0];
  const pick = bucket.names[Math.floor(Math.random() * bucket.names.length)];
  const capitalized = pick.charAt(0).toUpperCase() + pick.slice(1);

  return {
    hex,
    colourName: pick,
    paletteName: `${capitalized} Scale`,
  };
}
