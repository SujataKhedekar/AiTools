import { PairingState } from '../types/typography';
import { buildExportGoogleFontsUrl, getFontStack } from './fontLoader';

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : [r, g, b];
  }
  return null;
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;

  const lumA =
    0.2126 * channelLuminance(rgbA[0]) +
    0.7152 * channelLuminance(rgbA[1]) +
    0.0722 * channelLuminance(rgbA[2]);
  const lumB =
    0.2126 * channelLuminance(rgbB[0]) +
    0.7152 * channelLuminance(rgbB[1]) +
    0.0722 * channelLuminance(rgbB[2]);

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface WcagAssessment {
  ratio: number;
  label: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  passesNormal: boolean;
  passesLarge: boolean;
}

export function getWcagAssessment(foreground: string, background: string): WcagAssessment {
  const ratio = getContrastRatio(foreground, background);
  if (ratio >= 7) {
    return { ratio, label: 'AAA', passesNormal: true, passesLarge: true };
  }
  if (ratio >= 4.5) {
    return { ratio, label: 'AA', passesNormal: true, passesLarge: true };
  }
  if (ratio >= 3) {
    return { ratio, label: 'AA Large', passesNormal: false, passesLarge: true };
  }
  return { ratio, label: 'Fail', passesNormal: false, passesLarge: false };
}

export function generateHtmlLink(state: PairingState): string {
  const url = buildExportGoogleFontsUrl([
    { family: state.heading.family, weights: [state.heading.weight, 700] },
    { family: state.body.family, weights: [400, state.body.weight, 600] },
    { family: state.accent.family, weights: [state.accent.weight] },
  ]);

  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${url}" rel="stylesheet" />`;
}

export function generateCssCode(state: PairingState): string {
  const url = buildExportGoogleFontsUrl([
    { family: state.heading.family, weights: [state.heading.weight, 700] },
    { family: state.body.family, weights: [400, state.body.weight, 600] },
    { family: state.accent.family, weights: [state.accent.weight] },
  ]);

  return `@import url("${url}");

:root {
  --font-heading: ${getFontStack(state.heading.family)};
  --font-body: ${getFontStack(state.body.family)};
  --font-accent: ${getFontStack(state.accent.family)};

  --color-bg: ${state.palette.background};
  --color-surface: ${state.palette.surface};
  --color-heading: ${state.palette.headingColor};
  --color-body: ${state.palette.bodyColor};
  --color-accent: ${state.palette.accentColor};
}

body {
  font-family: var(--font-body);
  font-weight: ${state.body.weight};
  font-size: ${state.body.size}px;
  line-height: ${state.body.lineHeight};
  letter-spacing: ${state.body.letterSpacing}em;
  color: var(--color-body);
  background-color: var(--color-bg);
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: ${state.heading.weight};
  line-height: ${state.heading.lineHeight};
  letter-spacing: ${state.heading.letterSpacing}em;
  color: var(--color-heading);
  text-wrap: balance;
}

h1 {
  font-size: ${state.heading.size}px;
}

.meta-label {
  font-family: var(--font-accent);
  font-weight: ${state.accent.weight};
  letter-spacing: ${state.accent.letterSpacing}em;
}

p {
  max-width: ${state.body.measure}ch;
}`;
}

export function generateTailwindCode(state: PairingState): string {
  return `/* Add inside your global CSS file (Tailwind CSS v4) */
@import "tailwindcss";

@theme {
  --font-display: ${getFontStack(state.heading.family)};
  --font-sans: ${getFontStack(state.body.family)};
  --font-mono: ${getFontStack(state.accent.family)};

  --color-canvas: ${state.palette.background};
  --color-surface: ${state.palette.surface};
  --color-ink: ${state.palette.headingColor};
  --color-prose: ${state.palette.bodyColor};
  --color-brand: ${state.palette.accentColor};
}

/* Usage example:
<h1 className="font-display font-[${state.heading.weight}] text-[${state.heading.size}px] leading-[${state.heading.lineHeight}] tracking-[${state.heading.letterSpacing}em] text-ink">
  Headline
</h1>
<p className="font-sans font-[${state.body.weight}] text-[${state.body.size}px] leading-[${state.body.lineHeight}] max-w-[${state.body.measure}ch] text-prose">
  Body paragraph copy
</p>
*/`;
}

export function generateDesignTokensJson(state: PairingState): string {
  const tokens = {
    typography: {
      heading: {
        fontFamily: state.heading.family,
        fontWeight: state.heading.weight,
        fontSize: `${state.heading.size}px`,
        lineHeight: state.heading.lineHeight,
        letterSpacing: `${state.heading.letterSpacing}em`,
      },
      body: {
        fontFamily: state.body.family,
        fontWeight: state.body.weight,
        fontSize: `${state.body.size}px`,
        lineHeight: state.body.lineHeight,
        letterSpacing: `${state.body.letterSpacing}em`,
        measure: `${state.body.measure}ch`,
      },
      accent: {
        fontFamily: state.accent.family,
        fontWeight: state.accent.weight,
        letterSpacing: `${state.accent.letterSpacing}em`,
      },
    },
    color: {
      background: state.palette.background,
      surface: state.palette.surface,
      border: state.palette.border,
      heading: state.palette.headingColor,
      body: state.palette.bodyColor,
      muted: state.palette.mutedColor,
      accent: state.palette.accentColor,
    },
  };
  return JSON.stringify(tokens, null, 2);
}
