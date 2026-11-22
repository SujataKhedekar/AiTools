import QRCode from 'qrcode';
import {
  CornerDotStyle,
  CornerSquareStyle,
  ErrorCorrectionLevel,
  ModuleStyle,
  QRStyleConfig,
  ReadabilityReport,
} from '../types/qr';
import { getContrastRatio } from './colorUtils';

export interface QRMatrixResult {
  size: number;
  version: number;
  effectiveEC: ErrorCorrectionLevel;
  modules: boolean[][];
}

export interface RenderedQRSVG {
  svgMarkup: string;
  width: number;
  height: number;
  matrix: QRMatrixResult;
}

export function getEffectiveErrorCorrection(style: QRStyleConfig): ErrorCorrectionLevel {
  if (style.autoErrorCorrection && style.logoDataUrl) {
    return 'H';
  }
  return style.errorCorrection;
}

/**
 * Generates an ISO 18004 QR bit matrix locally using the open-source `qrcode` library.
 */
export function generateQRMatrix(payload: string, ecLevel: ErrorCorrectionLevel): QRMatrixResult {
  const safePayload = payload.trim().length > 0 ? payload : 'https://aivora.studio';
  const qr = QRCode.create(safePayload, { errorCorrectionLevel: ecLevel });
  const size = qr.modules.size;
  const modules: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    modules.push(row);
  }
  return {
    size,
    version: qr.version,
    effectiveEC: ecLevel,
    modules,
  };
}

/**
 * Checks whether (row, col) belongs to one of the three 7x7 finder patterns.
 */
function isInFinderPattern(r: number, c: number, size: number): boolean {
  const topLeft = r < 7 && c < 7;
  const topRight = r < 7 && c >= size - 7;
  const bottomLeft = r >= size - 7 && c < 7;
  return topLeft || topRight || bottomLeft;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number
): string {
  const maxR = Math.min(w, h) / 2;
  const rTL = Math.min(tl, maxR);
  const rTR = Math.min(tr, maxR);
  const rBR = Math.min(br, maxR);
  const rBL = Math.min(bl, maxR);
  return [
    `M ${f(x + rTL)} ${f(y)}`,
    `H ${f(x + w - rTR)}`,
    rTR > 0 ? `A ${f(rTR)} ${f(rTR)} 0 0 1 ${f(x + w)} ${f(y + rTR)}` : '',
    `V ${f(y + h - rBR)}`,
    rBR > 0 ? `A ${f(rBR)} ${f(rBR)} 0 0 1 ${f(x + w - rBR)} ${f(y + h)}` : '',
    `H ${f(x + rBL)}`,
    rBL > 0 ? `A ${f(rBL)} ${f(rBL)} 0 0 1 ${f(x)} ${f(y + h - rBL)}` : '',
    `V ${f(y + rTL)}`,
    rTL > 0 ? `A ${f(rTL)} ${f(rTL)} 0 0 1 ${f(x + rTL)} ${f(y)}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ');
}

function f(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function buildCornerSquareSvg(
  ox: number,
  oy: number,
  cell: number,
  style: CornerSquareStyle,
  fill: string,
  cornerIndex: 0 | 1 | 2 // 0=TL, 1=TR, 2=BL
): string {
  const outer = cell * 7;
  const inner = cell * 5;
  const inset = cell;

  if (style === 'dot') {
    const cx = ox + outer / 2;
    const cy = oy + outer / 2;
    const r = cell * 3;
    return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${fill}" stroke-width="${f(cell)}" />`;
  }

  let oTL = 0, oTR = 0, oBR = 0, oBL = 0;
  let iTL = 0, iTR = 0, iBR = 0, iBL = 0;

  if (style === 'rounded') {
    oTL = oTR = oBR = oBL = cell * 1.35;
    iTL = iTR = iBR = iBL = cell * 0.85;
  } else if (style === 'extra-rounded') {
    oTL = oTR = oBR = oBL = cell * 2.3;
    iTL = iTR = iBR = iBL = cell * 1.5;
  } else if (style === 'classy') {
    // Sharp inner corner pointing toward QR center, rounded outside corners
    const rOut = cell * 2.1;
    const rIn = cell * 1.3;
    if (cornerIndex === 0) {
      oTL = oTR = oBL = rOut; oBR = 0;
      iTL = iTR = iBL = rIn; iBR = 0;
    } else if (cornerIndex === 1) {
      oTL = oTR = oBR = rOut; oBL = 0;
      iTL = iTR = iBR = rIn; iBL = 0;
    } else {
      oTL = oBR = oBL = rOut; oTR = 0;
      iTL = iBR = iBL = rIn; iTR = 0;
    }
  } else if (style === 'leaf') {
    const rOut = cell * 2.4;
    const rIn = cell * 1.55;
    oTL = oBR = rOut; oTR = oBL = cell * 0.4;
    iTL = iBR = rIn; iTR = iBL = cell * 0.2;
  }

  const outerPath = roundedRectPath(ox, oy, outer, outer, oTL, oTR, oBR, oBL);
  const innerPath = roundedRectPath(ox + inset, oy + inset, inner, inner, iTL, iTR, iBR, iBL);
  return `<path d="${outerPath} ${innerPath}" fill="${fill}" fill-rule="evenodd" />`;
}

function buildCornerDotSvg(
  ox: number,
  oy: number,
  cell: number,
  style: CornerDotStyle,
  fill: string,
  cornerIndex: 0 | 1 | 2
): string {
  const x = ox + cell * 2;
  const y = oy + cell * 2;
  const s = cell * 3;
  const cx = x + s / 2;
  const cy = y + s / 2;

  switch (style) {
    case 'dot':
      return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s / 2)}" fill="${fill}" />`;
    case 'rounded':
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(cell * 0.85)}" fill="${fill}" />`;
    case 'diamond': {
      const d = `M ${f(cx)} ${f(y)} L ${f(x + s)} ${f(cy)} L ${f(cx)} ${f(y + s)} L ${f(x)} ${f(cy)} Z`;
      return `<path d="${d}" fill="${fill}" />`;
    }
    case 'classy': {
      const r = cell * 1.25;
      const d =
        cornerIndex === 0
          ? roundedRectPath(x, y, s, s, r, r, 0, r)
          : cornerIndex === 1
          ? roundedRectPath(x, y, s, s, r, r, r, 0)
          : roundedRectPath(x, y, s, s, r, 0, r, r);
      return `<path d="${d}" fill="${fill}" />`;
    }
    case 'square':
    default:
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" fill="${fill}" />`;
  }
}

function buildModulesSvg(
  modules: boolean[][],
  size: number,
  offsetX: number,
  offsetY: number,
  cell: number,
  style: ModuleStyle,
  fill: string,
  excavateBox: { x: number; y: number; w: number; h: number } | null
): string {
  const isActive = (r: number, c: number): boolean => {
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (!modules[r][c]) return false;
    if (isInFinderPattern(r, c, size)) return false;
    if (excavateBox) {
      const cx = offsetX + (c + 0.5) * cell;
      const cy = offsetY + (r + 0.5) * cell;
      if (
        cx >= excavateBox.x &&
        cx <= excavateBox.x + excavateBox.w &&
        cy >= excavateBox.y &&
        cy <= excavateBox.y + excavateBox.h
      ) {
        return false;
      }
    }
    return true;
  };

  const parts: string[] = [];

  // Vertical bars: merge consecutive vertical active cells into sleek vertical capsules
  if (style === 'vertical-bars') {
    const padX = cell * 0.1;
    const barW = cell - padX * 2;
    const rad = barW / 2;
    for (let c = 0; c < size; c++) {
      let r = 0;
      while (r < size) {
        if (!isActive(r, c)) {
          r++;
          continue;
        }
        const startR = r;
        while (r < size && isActive(r, c)) {
          r++;
        }
        const runLen = r - startR;
        const x = offsetX + c * cell + padX;
        const y = offsetY + startR * cell + cell * 0.04;
        const h = runLen * cell - cell * 0.08;
        parts.push(
          `<rect x="${f(x)}" y="${f(y)}" width="${f(barW)}" height="${f(h)}" rx="${f(rad)}" />`
        );
      }
    }
    return `<g fill="${fill}">${parts.join('')}</g>`;
  }

  // Horizontal bars: merge consecutive horizontal active cells into sleek horizontal capsules
  if (style === 'horizontal-bars') {
    const padY = cell * 0.1;
    const barH = cell - padY * 2;
    const rad = barH / 2;
    for (let r = 0; r < size; r++) {
      let c = 0;
      while (c < size) {
        if (!isActive(r, c)) {
          c++;
          continue;
        }
        const startC = c;
        while (c < size && isActive(r, c)) {
          c++;
        }
        const runLen = c - startC;
        const x = offsetX + startC * cell + cell * 0.04;
        const y = offsetY + r * cell + padY;
        const w = runLen * cell - cell * 0.08;
        parts.push(
          `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(barH)}" rx="${f(rad)}" />`
        );
      }
    }
    return `<g fill="${fill}">${parts.join('')}</g>`;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isActive(r, c)) continue;

      const x = offsetX + c * cell;
      const y = offsetY + r * cell;

      if (style === 'square') {
        // Slight overlap (0.04) prevents hairline anti-alias gaps in SVG viewers
        parts.push(
          `<rect x="${f(x)}" y="${f(y)}" width="${f(cell + 0.05)}" height="${f(cell + 0.05)}" />`
        );
      } else if (style === 'dots') {
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        const rad = cell * 0.43;
        parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" />`);
      } else if (style === 'rounded') {
        const pad = cell * 0.05;
        const s = cell - pad * 2;
        parts.push(
          `<rect x="${f(x + pad)}" y="${f(y + pad)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.28)}" />`
        );
      } else if (style === 'extra-rounded') {
        const top = isActive(r - 1, c);
        const bottom = isActive(r + 1, c);
        const left = isActive(r, c - 1);
        const right = isActive(r, c + 1);
        const rad = cell * 0.48;
        const tl = !top && !left ? rad : 0;
        const tr = !top && !right ? rad : 0;
        const br = !bottom && !right ? rad : 0;
        const bl = !bottom && !left ? rad : 0;
        const d = roundedRectPath(x, y, cell + 0.04, cell + 0.04, tl, tr, br, bl);
        parts.push(`<path d="${d}" />`);
      } else if (style === 'classy') {
        const top = isActive(r - 1, c);
        const bottom = isActive(r + 1, c);
        const left = isActive(r, c - 1);
        const right = isActive(r, c + 1);
        const rad = cell * 0.46;
        // Diagonal leaf corners where exposed on TL and BR
        const tl = !top && !left ? rad : 0;
        const br = !bottom && !right ? rad : 0;
        const d = roundedRectPath(x, y, cell + 0.04, cell + 0.04, tl, 0, br, 0);
        parts.push(`<path d="${d}" />`);
      } else if (style === 'classy-rounded') {
        const top = isActive(r - 1, c);
        const bottom = isActive(r + 1, c);
        const left = isActive(r, c - 1);
        const right = isActive(r, c + 1);
        const radBig = cell * 0.5;
        const radSoft = cell * 0.18;
        const tl = !top && !left ? radBig : 0;
        const tr = !top && !right ? radSoft : 0;
        const br = !bottom && !right ? radBig : 0;
        const bl = !bottom && !left ? radSoft : 0;
        const d = roundedRectPath(x, y, cell + 0.04, cell + 0.04, tl, tr, br, bl);
        parts.push(`<path d="${d}" />`);
      }
    }
  }

  return `<g fill="${fill}">${parts.join('')}</g>`;
}

/**
 * Renders the complete QR Code (with optional logo and optional branding frame) into crisp vector SVG.
 */
export function renderQRToSVG(
  payload: string,
  style: QRStyleConfig,
  options?: {
    includeFrame?: boolean;
    transparentOverride?: boolean;
    baseSize?: number;
  }
): RenderedQRSVG {
  const qrSize = options?.baseSize ?? 512;
  const includeFrame = options?.includeFrame ?? style.framePreset !== 'none';
  const isTransparentBg = options?.transparentOverride ?? style.bgTransparent;

  const effectiveEC = getEffectiveErrorCorrection(style);
  const matrix = generateQRMatrix(payload, effectiveEC);

  const hasFrame = includeFrame && style.framePreset !== 'none';
  const labelText = (style.frameText || 'SCAN ME').trim();

  // Compute outer canvas dimensions when frame is active
  let totalW = qrSize;
  let totalH = qrSize;
  let qrOriginX = 0;
  let qrOriginY = 0;
  let framePadding = 0;
  let labelBandH = 0;

  if (hasFrame) {
    framePadding = style.frameStyle === 'card' ? 28 : style.frameStyle === 'outline' ? 24 : 20;
    labelBandH = Math.max(58, Math.round(style.frameFontSize * 2.4));
    totalW = qrSize + framePadding * 2;
    totalH = qrSize + framePadding * 2 + labelBandH;
    qrOriginX = framePadding;
    qrOriginY = style.framePosition === 'top' ? framePadding + labelBandH : framePadding;
  }

  const quietModules = Math.max(0, Math.min(8, style.quietZone));
  const totalCells = matrix.size + quietModules * 2;
  const cell = qrSize / totalCells;
  const gridOffsetX = qrOriginX + quietModules * cell;
  const gridOffsetY = qrOriginY + quietModules * cell;

  // Gradient definitions
  const defs: string[] = [];
  let mainFill = style.fgColor;

  if (style.fgMode === 'gradient') {
    if (style.gradientType === 'radial') {
      defs.push(`
        <radialGradient id="aivora-qr-grad" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="${style.gradientStart}" />
          <stop offset="100%" stop-color="${style.gradientEnd}" />
        </radialGradient>
      `);
    } else {
      const rad = ((style.gradientRotation - 90) * Math.PI) / 180;
      const x1 = 50 - Math.cos(rad) * 50;
      const y1 = 50 - Math.sin(rad) * 50;
      const x2 = 50 + Math.cos(rad) * 50;
      const y2 = 50 + Math.sin(rad) * 50;
      defs.push(`
        <linearGradient id="aivora-qr-grad" x1="${f(x1)}%" y1="${f(y1)}%" x2="${f(x2)}%" y2="${f(y2)}%">
          <stop offset="0%" stop-color="${style.gradientStart}" />
          <stop offset="100%" stop-color="${style.gradientEnd}" />
        </linearGradient>
      `);
    }
    mainFill = 'url(#aivora-qr-grad)';
  }

  // Logo layout and module excavation box
  let excavateBox: { x: number; y: number; w: number; h: number } | null = null;
  let logoSvg = '';

  if (style.logoDataUrl) {
    const logoDim = (qrSize * style.logoSize) / 100;
    const pad = style.logoPadding;
    const containerDim = logoDim + pad * 2;
    const centerX = qrOriginX + qrSize / 2 + (qrSize * style.logoOffsetX) / 100;
    const centerY = qrOriginY + qrSize / 2 + (qrSize * style.logoOffsetY) / 100;
    const containerX = centerX - containerDim / 2;
    const containerY = centerY - containerDim / 2;
    const imgX = centerX - logoDim / 2;
    const imgY = centerY - logoDim / 2;

    if (style.logoExcavate) {
      const margin = cell * 0.35;
      excavateBox = {
        x: containerX - margin,
        y: containerY - margin,
        w: containerDim + margin * 2,
        h: containerDim + margin * 2,
      };
    }

    const containerRadius =
      style.logoShape === 'circle'
        ? containerDim / 2
        : style.logoShape === 'rounded'
        ? Math.min(containerDim * 0.22, 22)
        : 0;

    const imgRadius =
      style.logoShape === 'circle'
        ? logoDim / 2
        : style.logoShape === 'rounded'
        ? Math.max(0, containerRadius - pad * 0.5)
        : 0;

    defs.push(`
      <clipPath id="aivora-logo-clip">
        <rect x="${f(imgX)}" y="${f(imgY)}" width="${f(logoDim)}" height="${f(logoDim)}" rx="${f(imgRadius)}" />
      </clipPath>
    `);

    const logoBgRect = style.logoBgEnabled
      ? `<rect x="${f(containerX)}" y="${f(containerY)}" width="${f(containerDim)}" height="${f(containerDim)}" rx="${f(containerRadius)}" fill="${style.logoBgColor}" />`
      : '';

    logoSvg = `
      <g>
        ${logoBgRect}
        <image href="${style.logoDataUrl}" x="${f(imgX)}" y="${f(imgY)}" width="${f(logoDim)}" height="${f(logoDim)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#aivora-logo-clip)" />
      </g>
    `;
  }

  // Frame shell & label elements
  let frameShellSvg = '';
  let qrCardBgSvg = '';
  let frameLabelSvg = '';

  const outerRadius = Math.max(0, Math.min(36, style.frameRadius));
  const innerRadius = Math.max(0, outerRadius - 6);

  if (hasFrame) {
    const labelCenterY =
      style.framePosition === 'top'
        ? framePadding + labelBandH / 2
        : qrOriginY + qrSize + framePadding / 2 + labelBandH / 2;

    if (style.frameStyle === 'banner') {
      frameShellSvg = `<rect x="0" y="0" width="${f(totalW)}" height="${f(totalH)}" rx="${f(outerRadius)}" fill="${style.frameColor}" />`;
      if (!isTransparentBg) {
        qrCardBgSvg = `<rect x="${f(qrOriginX)}" y="${f(qrOriginY)}" width="${f(qrSize)}" height="${f(qrSize)}" rx="${f(innerRadius)}" fill="${style.bgColor}" />`;
      }
      frameLabelSvg = `
        <text x="${f(totalW / 2)}" y="${f(labelCenterY)}" text-anchor="middle" dominant-baseline="central"
          font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${f(style.frameFontSize)}"
          font-weight="${style.frameFontWeight}" letter-spacing="0.06em" fill="${style.frameTextColor}">
          ${escapeXml(labelText)}
        </text>
      `;
    } else if (style.frameStyle === 'card') {
      const cardBg = isTransparentBg ? 'none' : style.bgColor;
      frameShellSvg = `<rect x="2" y="2" width="${f(totalW - 4)}" height="${f(totalH - 4)}" rx="${f(outerRadius)}" fill="${cardBg}" stroke="${style.frameColor}" stroke-width="4" />`;
      const stripH = labelBandH - 10;
      const stripY =
        style.framePosition === 'top'
          ? framePadding - 4
          : qrOriginY + qrSize + 10;
      frameLabelSvg = `
        <rect x="${f(framePadding)}" y="${f(stripY)}" width="${f(qrSize)}" height="${f(stripH)}" rx="${f(Math.max(6, innerRadius - 2))}" fill="${style.frameColor}" />
        <text x="${f(totalW / 2)}" y="${f(stripY + stripH / 2)}" text-anchor="middle" dominant-baseline="central"
          font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${f(style.frameFontSize)}"
          font-weight="${style.frameFontWeight}" letter-spacing="0.06em" fill="${style.frameTextColor}">
          ${escapeXml(labelText)}
        </text>
      `;
    } else if (style.frameStyle === 'outline') {
      const bgFill = isTransparentBg ? 'none' : style.bgColor;
      frameShellSvg = `<rect x="3" y="3" width="${f(totalW - 6)}" height="${f(totalH - 6)}" rx="${f(outerRadius)}" fill="${bgFill}" stroke="${style.frameColor}" stroke-width="6" />`;
      const badgeW = Math.min(qrSize * 0.84, Math.max(180, labelText.length * style.frameFontSize * 0.72 + 48));
      const badgeH = Math.max(44, style.frameFontSize * 1.9);
      const badgeX = (totalW - badgeW) / 2;
      const badgeY = labelCenterY - badgeH / 2;
      frameLabelSvg = `
        <rect x="${f(badgeX)}" y="${f(badgeY)}" width="${f(badgeW)}" height="${f(badgeH)}" rx="${f(Math.min(badgeH / 2, outerRadius))}" fill="${style.frameColor}" />
        <text x="${f(totalW / 2)}" y="${f(badgeY + badgeH / 2)}" text-anchor="middle" dominant-baseline="central"
          font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${f(style.frameFontSize)}"
          font-weight="${style.frameFontWeight}" letter-spacing="0.06em" fill="${style.frameTextColor}">
          ${escapeXml(labelText)}
        </text>
      `;
    } else if (style.frameStyle === 'pill') {
      const bgFill = isTransparentBg ? 'none' : style.bgColor;
      frameShellSvg = `<rect x="0" y="0" width="${f(totalW)}" height="${f(totalH)}" rx="${f(outerRadius)}" fill="${bgFill}" />`;
      const pillW = Math.min(qrSize * 0.9, Math.max(180, labelText.length * style.frameFontSize * 0.72 + 56));
      const pillH = Math.max(46, style.frameFontSize * 1.95);
      const pillX = (totalW - pillW) / 2;
      const pillY = labelCenterY - pillH / 2;
      frameLabelSvg = `
        <rect x="${f(pillX)}" y="${f(pillY)}" width="${f(pillW)}" height="${f(pillH)}" rx="${f(pillH / 2)}" fill="${style.frameColor}" />
        <text x="${f(totalW / 2)}" y="${f(pillY + pillH / 2)}" text-anchor="middle" dominant-baseline="central"
          font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${f(style.frameFontSize)}"
          font-weight="${style.frameFontWeight}" letter-spacing="0.06em" fill="${style.frameTextColor}">
          ${escapeXml(labelText)}
        </text>
      `;
    }
  } else if (!isTransparentBg) {
    qrCardBgSvg = `<rect x="0" y="0" width="${f(qrSize)}" height="${f(qrSize)}" fill="${style.bgColor}" />`;
  }

  // Corner finder patterns (TL, TR, BL)
  const cornerSqFill = style.useCustomCornerColors ? style.cornerSquareColor : mainFill;
  const cornerDotFill = style.useCustomCornerColors ? style.cornerDotColor : mainFill;

  const corners: Array<{ r: number; c: number; idx: 0 | 1 | 2 }> = [
    { r: 0, c: 0, idx: 0 },
    { r: 0, c: matrix.size - 7, idx: 1 },
    { r: matrix.size - 7, c: 0, idx: 2 },
  ];

  const cornersSvg = corners
    .map(({ r, c, idx }) => {
      const ox = gridOffsetX + c * cell;
      const oy = gridOffsetY + r * cell;
      return (
        buildCornerSquareSvg(ox, oy, cell, style.cornerSquareStyle, cornerSqFill, idx) +
        buildCornerDotSvg(ox, oy, cell, style.cornerDotStyle, cornerDotFill, idx)
      );
    })
    .join('');

  // Data modules
  const modulesSvg = buildModulesSvg(
    matrix.modules,
    matrix.size,
    gridOffsetX,
    gridOffsetY,
    cell,
    style.moduleStyle,
    mainFill,
    excavateBox
  );

  const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(totalW)} ${f(totalH)}" width="${f(totalW)}" height="${f(totalH)}" role="img" aria-label="Generated QR Code">
  ${defs.length > 0 ? `<defs>${defs.join('')}</defs>` : ''}
  ${frameShellSvg}
  ${qrCardBgSvg}
  ${cornersSvg}
  ${modulesSvg}
  ${logoSvg}
  ${frameLabelSvg}
</svg>`.trim();

  return {
    svgMarkup,
    width: totalW,
    height: totalH,
    matrix,
  };
}

/**
 * Rasterizes the rendered SVG into a crisp PNG Blob at any target pixel width.
 */
export async function renderQRToPNGBlob(
  payload: string,
  style: QRStyleConfig,
  options: {
    targetWidth: number;
    includeFrame: boolean;
    transparentBg: boolean;
  }
): Promise<{ blob: Blob; width: number; height: number }> {
  const rendered = renderQRToSVG(payload, style, {
    includeFrame: options.includeFrame,
    transparentOverride: options.transparentBg,
    baseSize: 512,
  });

  const aspect = rendered.height / rendered.width;
  const outWidth = Math.max(128, Math.min(4096, Math.round(options.targetWidth)));
  const outHeight = Math.round(outWidth * aspect);

  // Set explicit export dimensions on root SVG for razor-sharp vector rasterization
  const sizedSvg = rendered.svgMarkup
    .replace(/width="[^"]+"/, `width="${outWidth}"`)
    .replace(/height="[^"]+"/, `height="${outHeight}"`);

  const svgBlob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to render QR SVG to canvas'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outWidth, outHeight);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('PNG export encoding failed'));
        },
        'image/png',
        1.0
      );
    });

    return { blob: pngBlob, width: outWidth, height: outHeight };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Evaluates real-time QR scan reliability based on WCAG contrast, logo area coverage,
 * error correction recovery capacity, quiet zone, and payload density.
 */
export function evaluateReadability(
  payload: string,
  style: QRStyleConfig,
  matrix: QRMatrixResult
): ReadabilityReport {
  const bgRef = style.bgTransparent ? '#FFFFFF' : style.bgColor;

  let contrastRatio: number;
  if (style.fgMode === 'gradient') {
    const c1 = getContrastRatio(style.gradientStart, bgRef);
    const c2 = getContrastRatio(style.gradientEnd, bgRef);
    contrastRatio = Math.min(c1, c2);
  } else {
    contrastRatio = getContrastRatio(style.fgColor, bgRef);
  }

  const effectiveEC = matrix.effectiveEC;
  const ecCapacity: Record<ErrorCorrectionLevel, number> = { L: 7, M: 15, Q: 25, H: 30 };

  let logoCoveragePct = 0;
  if (style.logoDataUrl) {
    const sideFraction = (style.logoSize + (style.logoPadding * 2 * 100) / 512) / 100;
    logoCoveragePct = Math.round(sideFraction * sideFraction * 100);
  }

  const tips: string[] = [];
  let status: 'optimal' | 'caution' | 'warning' = 'optimal';

  if (!payload.trim()) {
    status = 'caution';
    tips.push('Enter content in the left panel to encode your custom data.');
  }

  if (contrastRatio < 2.6) {
    status = 'warning';
    tips.push('Foreground and background contrast is too low for reliable camera scanning.');
  } else if (contrastRatio < 4.5) {
    if (status === 'optimal') status = 'caution';
    tips.push('Consider deepening foreground or lightening background for faster scans in dim light.');
  }

  if (style.logoDataUrl) {
    const capacity = ecCapacity[effectiveEC];
    if (logoCoveragePct > capacity * 0.72) {
      status = 'warning';
      tips.push(`Logo covers ~${logoCoveragePct}% of the code. Reduce logo size or use Level H error correction.`);
    } else if (effectiveEC === 'L' || effectiveEC === 'M') {
      if (status === 'optimal') status = 'caution';
      tips.push('Enable Level Q or H error correction when embedding a center logo.');
    }
  }

  if (style.quietZone < 2) {
    if (status === 'optimal') status = 'caution';
    tips.push('Quiet zone margin is narrow; 2–4 modules is recommended for print.');
  }

  if (matrix.version >= 14) {
    if (status === 'optimal') status = 'caution';
    tips.push('Dense payload detected; export at 2x or 4x resolution for crisp print legibility.');
  }

  if (tips.length === 0) {
    tips.push('High contrast and balanced recovery headroom — ready for print and screen scanning.');
  }

  const label =
    status === 'optimal'
      ? 'Scan Ready'
      : status === 'caution'
      ? 'Moderate Margin'
      : 'Low Scan Reliability';

  return {
    status,
    label,
    contrastRatio,
    effectiveEC,
    moduleCount: matrix.size,
    version: matrix.version,
    payloadLength: payload.length,
    logoCoveragePct,
    tips,
  };
}
