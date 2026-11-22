import type { AllowedImageMime, BrandAssetInput, ScreenshotInput } from '../shared/types';
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  stripDataUrlPrefix,
} from '../shared/validation';

export interface SampleUiPreset {
  id: string;
  title: string;
  category: string;
  roleLabel: string;
  imageUrl: string;
}

export const SAMPLE_UI_PRESETS: SampleUiPreset[] = [
  {
    id: 'saas-landing',
    title: 'DevSync SaaS Landing',
    category: 'Landing Page',
    roleLabel: 'Desktop Homepage',
    imageUrl: '/image-to-code/assets/sample_saas_landing_1795346355943.jpg',
  },
  {
    id: 'ecommerce-store',
    title: 'ARKIV Furniture Store',
    category: 'E-Commerce',
    roleLabel: 'Storefront Grid',
    imageUrl: '/image-to-code/assets/sample_ecommerce_store_1795346356529.jpg',
  },
  {
    id: 'analytics-dashboard',
    title: 'Synapse Analytics',
    category: 'SaaS Dashboard',
    roleLabel: 'Analytics Dashboard',
    imageUrl: '/image-to-code/assets/sample_analytics_dashboard_1795346358120.jpg',
  },
];

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image dimensions.'));
    img.src = dataUrl;
  });
}

/**
 * Downscales very large retina screenshots (>2200px or >4MB) cleanly while preserving sharp text/UI legibility.
 */
async function optimizeImageIfLarge(
  dataUrl: string,
  mimeType: AllowedImageMime,
  rawSizeBytes: number
): Promise<{ base64: string; mimeType: AllowedImageMime; width: number; height: number; sizeBytes: number }> {
  const img = await loadImageElement(dataUrl);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const MAX_DIM = 2200;
  const needsResize = width > MAX_DIM || height > MAX_DIM || rawSizeBytes > 4 * 1024 * 1024;

  if (!needsResize) {
    const { cleanBase64 } = stripDataUrlPrefix(dataUrl);
    return { base64: cleanBase64, mimeType, width, height, sizeBytes: rawSizeBytes };
  }

  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const { cleanBase64 } = stripDataUrlPrefix(dataUrl);
    return { base64: cleanBase64, mimeType, width, height, sizeBytes: rawSizeBytes };
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const outputMime: AllowedImageMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const optimizedUrl = canvas.toDataURL(outputMime, 0.9);
  const { cleanBase64 } = stripDataUrlPrefix(optimizedUrl);
  const approxSize = Math.floor((cleanBase64.length * 3) / 4);

  return {
    base64: cleanBase64,
    mimeType: outputMime,
    width: targetW,
    height: targetH,
    sizeBytes: approxSize,
  };
}

export async function fileToScreenshotInput(
  file: File,
  roleLabel?: string
): Promise<ScreenshotInput> {
  const mime = file.type.toLowerCase() as AllowedImageMime;
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new Error(`Unsupported file type "${file.type || file.name}". Upload PNG, JPG/JPEG, or WebP.`);
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`"${file.name}" exceeds the 10 MB maximum file size.`);
  }

  const dataUrl = await readBlobAsDataUrl(file);
  const optimized = await optimizeImageIfLarge(dataUrl, mime, file.size);

  return {
    id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    mimeType: optimized.mimeType,
    sizeBytes: optimized.sizeBytes,
    base64: optimized.base64,
    roleLabel: roleLabel || inferRoleLabelFromName(file.name),
    width: optimized.width,
    height: optimized.height,
  };
}

export async function fileToBrandAssetInput(file: File, customLabel?: string): Promise<BrandAssetInput> {
  const mime = file.type.toLowerCase() as AllowedImageMime;
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new Error(`Unsupported asset format "${file.type || file.name}". Upload PNG, JPG/JPEG, or WebP.`);
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Asset "${file.name}" exceeds 10 MB limit.`);
  }

  const dataUrl = await readBlobAsDataUrl(file);
  const optimized = await optimizeImageIfLarge(dataUrl, mime, file.size);
  const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  return {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    label: (customLabel || baseName || 'brand-asset').slice(0, 40),
    mimeType: optimized.mimeType,
    sizeBytes: optimized.sizeBytes,
    base64: optimized.base64,
  };
}

export async function loadSamplePresetAsScreenshot(preset: SampleUiPreset): Promise<ScreenshotInput> {
  const res = await fetch(preset.imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to load sample image "${preset.title}".`);
  }
  const blob = await res.blob();
  const mime: AllowedImageMime = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const dataUrl = await readBlobAsDataUrl(blob);
  const img = await loadImageElement(dataUrl);
  const { cleanBase64 } = stripDataUrlPrefix(dataUrl);

  return {
    id: `sample-${preset.id}-${Date.now()}`,
    name: `${preset.id}.jpg`,
    mimeType: mime,
    sizeBytes: blob.size,
    base64: cleanBase64,
    roleLabel: preset.roleLabel,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

function inferRoleLabelFromName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('mobile')) return 'Mobile View';
  if (lower.includes('tablet')) return 'Tablet View';
  if (lower.includes('dash')) return 'Dashboard Screen';
  if (lower.includes('product')) return 'Product Page';
  if (lower.includes('about')) return 'About Page';
  if (lower.includes('login') || lower.includes('signup')) return 'Auth Screen';
  return 'Desktop Screen';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
