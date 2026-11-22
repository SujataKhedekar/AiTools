import {
  ExportFormat,
  GenerationMode,
  ShadeEntry,
} from '../types/palette';
import { sanitizeSlug } from './colorScience';

export interface ExportContext {
  paletteName: string;
  colourName: string;
  baseHex: string;
  mode: GenerationMode;
  shades: ShadeEntry[];
  uppercaseHex: boolean;
}

function fmtHex(hex: string, uppercase: boolean): string {
  return uppercase ? hex.toUpperCase() : hex.toLowerCase();
}

export function generateCssVariables(ctx: ExportContext): string {
  const key = sanitizeSlug(ctx.colourName);
  const lines = ctx.shades.map(
    (s) => `  --${key}-${s.level}: ${fmtHex(s.hex, ctx.uppercaseHex)};`
  );
  return `:root {\n${lines.join('\n')}\n}`;
}

export function generateTailwindV4Config(ctx: ExportContext): string {
  const key = sanitizeSlug(ctx.colourName);
  const lines = ctx.shades.map(
    (s) => `  --color-${key}-${s.level}: ${fmtHex(s.hex, ctx.uppercaseHex)};`
  );
  return `@import "tailwindcss";\n\n@theme {\n${lines.join('\n')}\n}`;
}

export function generateTailwindV3Config(ctx: ExportContext): string {
  const key = sanitizeSlug(ctx.colourName);
  const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
  const lines = ctx.shades.map(
    (s) => `          ${s.level}: '${fmtHex(s.hex, ctx.uppercaseHex)}',`
  );
  return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        ${safeKey}: {
${lines.join('\n')}
        },
      },
    },
  },
};`;
}

export function generateJsonExport(ctx: ExportContext): string {
  const key = sanitizeSlug(ctx.colourName);
  const shadeMap: Record<string, string> = {};
  const detailed: Record<
    string,
    {
      hex: string;
      rgb: string;
      oklch: string;
      contrastOnWhite: number;
      contrastOnDark: number;
    }
  > = {};

  for (const s of ctx.shades) {
    const h = fmtHex(s.hex, ctx.uppercaseHex);
    shadeMap[String(s.level)] = h;
    detailed[String(s.level)] = {
      hex: h,
      rgb: `rgb(${s.rgb.r}, ${s.rgb.g}, ${s.rgb.b})`,
      oklch: `oklch(${(s.oklch.l * 100).toFixed(1)}% ${s.oklch.c.toFixed(3)} ${Math.round(s.oklch.h)})`,
      contrastOnWhite: Number(s.contrastWhite.toFixed(2)),
      contrastOnDark: Number(s.contrastDark.toFixed(2)),
    };
  }

  return JSON.stringify(
    {
      name: ctx.paletteName || ctx.colourName || 'Primary Palette',
      key,
      base: fmtHex(ctx.baseHex, ctx.uppercaseHex),
      mode: ctx.mode,
      shades: shadeMap,
      tokens: detailed,
    },
    null,
    2
  );
}

export function generateScssExport(ctx: ExportContext): string {
  const key = sanitizeSlug(ctx.colourName);
  const vars = ctx.shades.map(
    (s) => `$${key}-${s.level}: ${fmtHex(s.hex, ctx.uppercaseHex)};`
  );
  const mapLines = ctx.shades.map(
    (s) => `  ${s.level}: $${key}-${s.level},`
  );
  return `${vars.join('\n')}\n\n$${key}-palette: (\n${mapLines.join('\n')}\n);`;
}

export function generateHexListExport(ctx: ExportContext): string {
  return ctx.shades
    .map((s) => `${String(s.level).padStart(3, ' ')}: ${fmtHex(s.hex, ctx.uppercaseHex)}`)
    .join('\n');
}

export function getExportCode(
  format: ExportFormat,
  ctx: ExportContext
): { code: string; filename: string; mime: string } {
  const key = sanitizeSlug(ctx.colourName);
  switch (format) {
    case 'css':
      return {
        code: generateCssVariables(ctx),
        filename: `${key}-variables.css`,
        mime: 'text/css;charset=utf-8',
      };
    case 'tailwind-v4':
      return {
        code: generateTailwindV4Config(ctx),
        filename: `${key}-theme.css`,
        mime: 'text/css;charset=utf-8',
      };
    case 'tailwind-v3':
      return {
        code: generateTailwindV3Config(ctx),
        filename: `tailwind.${key}.config.js`,
        mime: 'application/javascript;charset=utf-8',
      };
    case 'json':
      return {
        code: generateJsonExport(ctx),
        filename: `${key}-palette.json`,
        mime: 'application/json;charset=utf-8',
      };
    case 'scss':
      return {
        code: generateScssExport(ctx),
        filename: `_${key}-palette.scss`,
        mime: 'text/x-scss;charset=utf-8',
      };
    case 'hex':
      return {
        code: generateHexListExport(ctx),
        filename: `${key}-hex-list.txt`,
        mime: 'text/plain;charset=utf-8',
      };
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function downloadTextFile(
  content: string,
  filename: string,
  mime = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
