import { BackdropSettings, MatteSettings } from '../types/studio';
import { STUDIO_GRADIENTS } from '../data/samples';

/**
 * Fast perceptual Redmean color distance (0..~765 scale, normalized to 0..100).
 * Closely tracks human visual contrast while staying fast enough for 60fps real-time matting.
 */
function perceptualDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rMean = (r1 + r2) * 0.5;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const wR = 2 + rMean / 256;
  const wG = 4;
  const wB = 2 + (255 - rMean) / 256;
  return Math.sqrt(wR * dr * dr + wG * dg * dg + wB * db * db) * 0.1307;
}

/**
 * Instant edge-aware background matte computed purely from image pixels (~8-14ms).
 * Samples multi-cluster perimeter colors and executes an edge-guided flood fill from
 * all four image borders so interior subject highlights remain protected.
 */
export function computeSmartBorderMatte(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number,
  edgeStrength: number
): Uint8ClampedArray {
  const total = width * height;
  const alpha = new Uint8ClampedArray(total);
  alpha.fill(255);

  // 1. Sample border pixels into up to 14 distinct color clusters
  const paletteR: number[] = [];
  const paletteG: number[] = [];
  const paletteB: number[] = [];
  const sampleStep = Math.max(2, Math.floor(Math.min(width, height) / 70));
  const clusterMergeDist = 6.5;

  const tryAddSample = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];
    for (let c = 0; c < paletteR.length; c++) {
      if (perceptualDist(r, g, b, paletteR[c], paletteG[c], paletteB[c]) < clusterMergeDist) {
        paletteR[c] = paletteR[c] * 0.85 + r * 0.15;
        paletteG[c] = paletteG[c] * 0.85 + g * 0.15;
        paletteB[c] = paletteB[c] * 0.85 + b * 0.15;
        return;
      }
    }
    if (paletteR.length < 14) {
      paletteR.push(r);
      paletteG.push(g);
      paletteB.push(b);
    }
  };

  for (let x = 0; x < width; x += sampleStep) {
    tryAddSample(x, 0);
    tryAddSample(x, 2);
    tryAddSample(x, height - 1);
    tryAddSample(x, Math.max(0, height - 3));
  }
  for (let y = 0; y < height; y += sampleStep) {
    tryAddSample(0, y);
    tryAddSample(2, y);
    tryAddSample(width - 1, y);
    tryAddSample(Math.max(0, width - 3), y);
  }

  const pLen = paletteR.length;
  const minDistToPalette = (r: number, g: number, b: number): number => {
    let best = 999;
    for (let c = 0; c < pLen; c++) {
      const d = perceptualDist(r, g, b, paletteR[c], paletteG[c], paletteB[c]);
      if (d < best) best = d;
    }
    return best;
  };

  // 2. Flood fill from perimeter with gradient-edge barrier
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const hardThresh = tolerance;
  const softBand = Math.max(6, tolerance * 0.38);
  const maxStepDiff = 4 + (100 - edgeStrength) * 0.24;

  const seedPixel = (x: number, y: number) => {
    const p = y * width + x;
    if (visited[p]) return;
    const idx = p * 4;
    const d = minDistToPalette(rgba[idx], rgba[idx + 1], rgba[idx + 2]);
    if (d <= hardThresh + softBand * 0.5) {
      visited[p] = 1;
      alpha[p] = d <= hardThresh ? 0 : Math.round(((d - hardThresh) / softBand) * 255);
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    seedPixel(x, 0);
    seedPixel(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    seedPixel(0, y);
    seedPixel(width - 1, y);
  }

  const offsets = [-1, 1, -width, width];

  while (head < tail) {
    const p = queue[head++];
    const px = p % width;
    const py = (p - px) / width;
    const pIdx = p * 4;
    const pr = rgba[pIdx];
    const pg = rgba[pIdx + 1];
    const pb = rgba[pIdx + 2];

    for (let k = 0; k < 4; k++) {
      if (k === 0 && px === 0) continue;
      if (k === 1 && px === width - 1) continue;
      if (k === 2 && py === 0) continue;
      if (k === 3 && py === height - 1) continue;

      const np = p + offsets[k];
      if (visited[np]) continue;

      const nIdx = np * 4;
      const nr = rgba[nIdx];
      const ng = rgba[nIdx + 1];
      const nb = rgba[nIdx + 2];

      const stepDiff = perceptualDist(pr, pg, pb, nr, ng, nb);
      if (stepDiff > maxStepDiff) continue;

      const palDist = minDistToPalette(nr, ng, nb);
      if (palDist <= hardThresh) {
        visited[np] = 1;
        alpha[np] = 0;
        queue[tail++] = np;
      } else if (palDist <= hardThresh + softBand) {
        visited[np] = 1;
        const frac = (palDist - hardThresh) / softBand;
        alpha[np] = Math.min(255, Math.max(0, Math.round(frac * 255)));
        if (frac < 0.45) {
          queue[tail++] = np;
        }
      }
    }
  }

  return alpha;
}

/**
 * Magic Wand flood fill at a clicked coordinate (x, y) in image space.
 * Mutates `manualMask` in place (`-255` erase or `+255` restore).
 */
export function applyMagicWand(
  rgba: Uint8ClampedArray,
  manualMask: Int16Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number,
  mode: 'erase' | 'restore'
): number {
  const sx = Math.max(0, Math.min(width - 1, Math.round(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(startY)));
  const startP = sy * width + sx;
  const sIdx = startP * 4;
  const sr = rgba[sIdx];
  const sg = rgba[sIdx + 1];
  const sb = rgba[sIdx + 2];

  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  visited[startP] = 1;
  queue[tail++] = startP;

  const targetDelta = mode === 'erase' ? -255 : 255;
  const softBand = Math.max(5, tolerance * 0.3);
  const offsets = [-1, 1, -width, width];
  let affected = 0;

  while (head < tail) {
    const p = queue[head++];
    const px = p % width;
    const py = (p - px) / width;
    const pIdx = p * 4;
    const d = perceptualDist(sr, sg, sb, rgba[pIdx], rgba[pIdx + 1], rgba[pIdx + 2]);

    const strength = d <= tolerance ? 1 : Math.max(0, 1 - (d - tolerance) / softBand);
    if (strength > 0) {
      const delta = Math.round(targetDelta * strength);
      if (mode === 'erase') {
        manualMask[p] = Math.min(manualMask[p], delta);
      } else {
        manualMask[p] = Math.max(manualMask[p], delta);
      }
      affected++;
    }

    if (d > tolerance + softBand * 0.4) continue;

    for (let k = 0; k < 4; k++) {
      if (k === 0 && px === 0) continue;
      if (k === 1 && px === width - 1) continue;
      if (k === 2 && py === 0) continue;
      if (k === 3 && py === height - 1) continue;

      const np = p + offsets[k];
      if (visited[np]) continue;

      const nIdx = np * 4;
      const nd = perceptualDist(sr, sg, sb, rgba[nIdx], rgba[nIdx + 1], rgba[nIdx + 2]);
      if (nd <= tolerance + softBand) {
        visited[np] = 1;
        queue[tail++] = np;
      }
    }
  }

  return affected;
}

/**
 * Smooth interpolated brush stroke stamped into `manualMask` in real time.
 */
export function applyBrushStroke(
  manualMask: Int16Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  hardness: number,
  mode: 'erase' | 'restore'
): void {
  const r = Math.max(2, radius);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(1.5, r * 0.22);
  const steps = Math.max(1, Math.ceil(dist / step));
  const innerRatio = Math.min(0.98, Math.max(0.05, hardness / 100));
  const sign = mode === 'erase' ? -1 : 1;

  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 0 : s / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;

    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(width - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(height - 1, Math.ceil(cy + r));

    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      const oy = y - cy;
      const oy2 = oy * oy;
      for (let x = minX; x <= maxX; x++) {
        const ox = x - cx;
        const d = Math.sqrt(ox * ox + oy2) / r;
        if (d >= 1) continue;

        let falloff = 1;
        if (d > innerRatio) {
          const u = (d - innerRatio) / (1 - innerRatio);
          // Smoothstep falloff
          falloff = 1 - u * u * (3 - 2 * u);
        }

        const p = rowOffset + x;
        const target = Math.round(sign * 255 * falloff);
        if (sign < 0) {
          if (target < manualMask[p]) manualMask[p] = target;
        } else {
          if (target > manualMask[p]) manualMask[p] = target;
        }
      }
    }
  }
}

/**
 * Separable O(N) morphological erosion (radius < 0) or dilation (radius > 0).
 */
function applyMorphology(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  tmp: Uint8ClampedArray,
  width: number,
  height: number,
  shift: number
): void {
  const rad = Math.min(10, Math.abs(Math.round(shift)));
  if (rad === 0) {
    dst.set(src);
    return;
  }
  const dilate = shift > 0;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const xStart = Math.max(0, x - rad);
      const xEnd = Math.min(width - 1, x + rad);
      let best = dilate ? 0 : 255;
      for (let k = xStart; k <= xEnd; k++) {
        const v = src[row + k];
        if (dilate ? v > best : v < best) best = v;
      }
      tmp[row + x] = best;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    const yStart = Math.max(0, y - rad);
    const yEnd = Math.min(height - 1, y + rad);
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let best = dilate ? 0 : 255;
      for (let ky = yStart; ky <= yEnd; ky++) {
        const v = tmp[ky * width + x];
        if (dilate ? v > best : v < best) best = v;
      }
      dst[row + x] = best;
    }
  }
}

/**
 * Separable O(N) sliding-window box blur on single-channel alpha.
 */
function applyBoxBlur(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  tmp: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(12, Math.round(radius));
  if (r <= 0) {
    dst.set(src);
    return;
  }
  const windowSize = r * 2 + 1;

  // Horizontal sliding sum
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let k = -r; k <= r; k++) {
      const cx = k < 0 ? 0 : k >= width ? width - 1 : k;
      sum += src[row + cx];
    }
    tmp[row] = Math.round(sum / windowSize);
    for (let x = 1; x < width; x++) {
      const addX = Math.min(width - 1, x + r);
      const subX = Math.max(0, x - r - 1);
      sum += src[row + addX] - src[row + subX];
      tmp[row + x] = Math.round(sum / windowSize);
    }
  }

  // Vertical sliding sum
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -r; k <= r; k++) {
      const cy = k < 0 ? 0 : k >= height ? height - 1 : k;
      sum += tmp[cy * width + x];
    }
    dst[x] = Math.round(sum / windowSize);
    for (let y = 1; y < height; y++) {
      const addY = Math.min(height - 1, y + r);
      const subY = Math.max(0, y - r - 1);
      sum += tmp[addY * width + x] - tmp[subY * width + x];
      dst[y * width + x] = Math.round(sum / windowSize);
    }
  }
}

export interface MatteScratchBuffers {
  combined: Uint8ClampedArray;
  morph: Uint8ClampedArray;
  scratch: Uint8ClampedArray;
  finalAlpha: Uint8ClampedArray;
}

export function createScratchBuffers(pixelCount: number): MatteScratchBuffers {
  return {
    combined: new Uint8ClampedArray(pixelCount),
    morph: new Uint8ClampedArray(pixelCount),
    scratch: new Uint8ClampedArray(pixelCount),
    finalAlpha: new Uint8ClampedArray(pixelCount),
  };
}

/**
 * Full 60fps real-time matte pipeline:
 * baseMask + manualMask -> invert -> threshold -> edgeShift -> feather -> color decontamination.
 */
export function compositeRealTimeMatte(
  sourceRgba: Uint8ClampedArray,
  baseMask: Uint8ClampedArray,
  manualMask: Int16Array,
  outRgba: Uint8ClampedArray,
  buffers: MatteScratchBuffers,
  width: number,
  height: number,
  settings: MatteSettings
): Uint8ClampedArray {
  const total = width * height;
  const { combined, morph, scratch, finalAlpha } = buffers;

  // Threshold pivot shift: positive tightens cutout (clips low alpha), negative expands soft edges
  const threshShift = settings.threshold * 2.2;
  const contrastSlope = 1 + Math.abs(settings.threshold) * 0.015;

  // 1. Combine base mask + manual brush/wand edits + threshold + optional invert
  for (let i = 0; i < total; i++) {
    let a = baseMask[i] + manualMask[i];
    if (a < 0) a = 0;
    else if (a > 255) a = 255;

    if (settings.invertMask) {
      a = 255 - a;
    }

    if (settings.threshold !== 0) {
      const shifted = (a - 127.5 - threshShift) * contrastSlope + 127.5;
      a = shifted < 0 ? 0 : shifted > 255 ? 255 : Math.round(shifted);
    }

    combined[i] = a;
  }

  // 2. Morphological Edge Shift (Choke / Spread)
  if (settings.edgeShift !== 0) {
    applyMorphology(combined, morph, scratch, width, height, settings.edgeShift);
  } else {
    morph.set(combined);
  }

  // 3. Soft Feather (2-pass fast box blur approximation)
  if (settings.feather > 0) {
    applyBoxBlur(morph, finalAlpha, scratch, width, height, settings.feather);
    if (settings.feather >= 2) {
      applyBoxBlur(finalAlpha, morph, scratch, width, height, Math.max(1, Math.floor(settings.feather * 0.6)));
      finalAlpha.set(morph);
    }
  } else {
    finalAlpha.set(morph);
  }

  // 4. Write RGBA + Real-Time Edge Color Decontamination (eliminates fringe halos)
  const decontamStrength = settings.decontaminate / 100;
  const sampleRadius = 3;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const p = row + x;
      const idx = p * 4;
      const a = finalAlpha[p];

      if (a === 0) {
        outRgba[idx] = 0;
        outRgba[idx + 1] = 0;
        outRgba[idx + 2] = 0;
        outRgba[idx + 3] = 0;
        continue;
      }

      let r = sourceRgba[idx];
      let g = sourceRgba[idx + 1];
      let b = sourceRgba[idx + 2];

      if (decontamStrength > 0.01 && a > 6 && a < 244) {
        // Estimate nearest opaque foreground color around semi-transparent edge pixel
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let weightSum = 0;

        for (let dy = -sampleRadius; dy <= sampleRadius; dy += 2) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          const nRow = ny * width;
          for (let dx = -sampleRadius; dx <= sampleRadius; dx += 2) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const np = nRow + nx;
            const na = finalAlpha[np];
            if (na >= 225) {
              const nIdx = np * 4;
              const w = na;
              sumR += sourceRgba[nIdx] * w;
              sumG += sourceRgba[nIdx + 1] * w;
              sumB += sourceRgba[nIdx + 2] * w;
              weightSum += w;
            }
          }
        }

        if (weightSum > 0) {
          const fgR = sumR / weightSum;
          const fgG = sumG / weightSum;
          const fgB = sumB / weightSum;
          const edgeFactor = (1 - a / 255) * decontamStrength * 0.92;
          r = Math.round(r + (fgR - r) * edgeFactor);
          g = Math.round(g + (fgG - g) * edgeFactor);
          b = Math.round(b + (fgB - b) * edgeFactor);
        }
      }

      outRgba[idx] = r;
      outRgba[idx + 1] = g;
      outRgba[idx + 2] = b;
      outRgba[idx + 3] = a;
    }
  }

  return finalAlpha;
}

/**
 * Draws the configured backdrop (transparent, solid, studio gradient, blurred original bokeh,
 * or custom backdrop image) plus optional live studio drop shadow and the foreground cutout.
 */
export function drawStudioComposition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  foregroundCanvas: HTMLCanvasElement,
  backdrop: BackdropSettings,
  customBackdropImg: HTMLImageElement | null,
  forceOpaqueColor?: string
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Backdrop
  if (backdrop.mode === 'transparent' && forceOpaqueColor) {
    ctx.fillStyle = forceOpaqueColor;
    ctx.fillRect(0, 0, width, height);
  } else if (backdrop.mode === 'color') {
    ctx.fillStyle = backdrop.color;
    ctx.fillRect(0, 0, width, height);
  } else if (backdrop.mode === 'gradient') {
    const preset = STUDIO_GRADIENTS.find((g) => g.id === backdrop.gradientId) ?? STUDIO_GRADIENTS[0];
    const rad = ((preset.angleDeg - 90) * Math.PI) / 180;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const len = Math.hypot(width, height) * 0.5;
    const grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len,
      cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len,
      cy + Math.sin(rad) * len
    );
    grad.addColorStop(0, preset.stops[0]);
    grad.addColorStop(1, preset.stops[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (backdrop.mode === 'blur') {
    ctx.save();
    // Slight overscan prevents edge vignette bleed from Gaussian blur filter
    const pad = Math.ceil(backdrop.blurRadius * 2.2);
    ctx.filter = `blur(${backdrop.blurRadius}px)`;
    ctx.drawImage(sourceImg, -pad, -pad, width + pad * 2, height + pad * 2);
    ctx.restore();
  } else if (backdrop.mode === 'image' && customBackdropImg && customBackdropImg.complete) {
    // Object-cover crop for custom backdrop image
    const imgRatio = customBackdropImg.naturalWidth / Math.max(1, customBackdropImg.naturalHeight);
    const canvasRatio = width / Math.max(1, height);
    let drawW = width;
    let drawH = height;
    let ox = 0;
    let oy = 0;
    if (imgRatio > canvasRatio) {
      drawH = height;
      drawW = height * imgRatio;
      ox = (width - drawW) * 0.5;
    } else {
      drawW = width;
      drawH = width / imgRatio;
      oy = (height - drawH) * 0.5;
    }
    ctx.drawImage(customBackdropImg, ox, oy, drawW, drawH);
  } else if (backdrop.mode === 'image' && forceOpaqueColor) {
    ctx.fillStyle = forceOpaqueColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Foreground with optional Studio Drop Shadow
  ctx.save();
  if (backdrop.shadowEnabled && backdrop.shadowOpacity > 0) {
    const alpha = Math.min(1, Math.max(0, backdrop.shadowOpacity / 100));
    ctx.shadowColor = `rgba(0, 0, 0, ${alpha.toFixed(2)})`;
    ctx.shadowBlur = backdrop.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = backdrop.shadowOffsetY;
  }
  ctx.drawImage(foregroundCanvas, 0, 0, width, height);
  ctx.restore();

  ctx.restore();
}
