import type { AllowedImageMime, BrandAssetInput, ScreenshotInput } from './types';

export const ALLOWED_IMAGE_MIMES = new Set<AllowedImageMime>([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per image
export const MAX_SCREENSHOTS = 6;
export const MAX_ASSETS = 8;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

export function stripDataUrlPrefix(rawBase64: string): {
  cleanBase64: string;
  detectedMime?: string;
} {
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(rawBase64.trim());
  if (match) {
    return { detectedMime: match[1].toLowerCase(), cleanBase64: match[2] };
  }
  return { cleanBase64: rawBase64.trim() };
}

/**
 * Verifies magic bytes of decoded image buffer match PNG, JPEG, or WebP.
 */
export function verifyImageMagicBytes(base64: string, declaredMime: AllowedImageMime): boolean {
  try {
    const sample = base64.slice(0, 64);
    const binaryStr =
      typeof Buffer !== 'undefined'
        ? Buffer.from(sample, 'base64')
        : Uint8Array.from(atob(sample), (c) => c.charCodeAt(0));

    if (binaryStr.length < 12) return false;

    if (declaredMime === 'image/png') {
      return (
        binaryStr[0] === 0x89 &&
        binaryStr[1] === 0x50 &&
        binaryStr[2] === 0x4e &&
        binaryStr[3] === 0x47
      );
    }

    if (declaredMime === 'image/jpeg') {
      return binaryStr[0] === 0xff && binaryStr[1] === 0xd8 && binaryStr[2] === 0xff;
    }

    if (declaredMime === 'image/webp') {
      // RIFF....WEBP
      return (
        binaryStr[0] === 0x52 &&
        binaryStr[1] === 0x49 &&
        binaryStr[2] === 0x46 &&
        binaryStr[3] === 0x46 &&
        binaryStr[8] === 0x57 &&
        binaryStr[9] === 0x45 &&
        binaryStr[10] === 0x42 &&
        binaryStr[11] === 0x50
      );
    }

    return false;
  } catch {
    return false;
  }
}

export function validateScreenshotInputs(items: unknown): ScreenshotInput[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new InputValidationError('Please upload at least one UI screenshot (PNG, JPG, or WebP).');
  }
  if (items.length > MAX_SCREENSHOTS) {
    throw new InputValidationError(`Maximum ${MAX_SCREENSHOTS} screenshots allowed per generation.`);
  }

  return items.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new InputValidationError(`Invalid screenshot entry at index ${index}.`);
    }
    const item = raw as Record<string, unknown>;
    const mimeType = String(item.mimeType ?? '').toLowerCase() as AllowedImageMime;
    if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
      throw new InputValidationError(
        `Unsupported image format "${mimeType}". Allowed formats: PNG, JPG/JPEG, WebP.`
      );
    }

    const { cleanBase64 } = stripDataUrlPrefix(String(item.base64 ?? ''));
    if (!cleanBase64 || cleanBase64.length < 32) {
      throw new InputValidationError(`Screenshot "${String(item.name ?? index)}" contains empty image data.`);
    }

    const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new InputValidationError(
        `Screenshot "${String(item.name ?? index)}" exceeds the 10 MB file size limit.`
      );
    }

    if (!verifyImageMagicBytes(cleanBase64, mimeType)) {
      throw new InputValidationError(
        `File "${String(item.name ?? index)}" failed image header verification for ${mimeType}.`
      );
    }

    return {
      id: String(item.id ?? `shot-${index + 1}`).slice(0, 64),
      name: String(item.name ?? `screenshot-${index + 1}.png`).slice(0, 120),
      mimeType,
      sizeBytes: Number(item.sizeBytes) || approxBytes,
      base64: cleanBase64,
      roleLabel: String(item.roleLabel ?? `Screen ${index + 1}`).slice(0, 80),
      width: typeof item.width === 'number' ? item.width : undefined,
      height: typeof item.height === 'number' ? item.height : undefined,
    };
  });
}

export function validateAssetInputs(items: unknown): BrandAssetInput[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  if (items.length > MAX_ASSETS) {
    throw new InputValidationError(`Maximum ${MAX_ASSETS} supplementary brand assets allowed.`);
  }

  return items.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new InputValidationError(`Invalid asset entry at index ${index}.`);
    }
    const item = raw as Record<string, unknown>;
    const mimeType = String(item.mimeType ?? '').toLowerCase() as AllowedImageMime;
    if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
      throw new InputValidationError(
        `Unsupported asset format "${mimeType}". Allowed formats: PNG, JPG/JPEG, WebP.`
      );
    }

    const { cleanBase64 } = stripDataUrlPrefix(String(item.base64 ?? ''));
    const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new InputValidationError(`Asset "${String(item.name ?? index)}" exceeds 10 MB limit.`);
    }
    if (!verifyImageMagicBytes(cleanBase64, mimeType)) {
      throw new InputValidationError(
        `Asset "${String(item.name ?? index)}" failed image header verification.`
      );
    }

    const rawLabel = String(item.label ?? `asset-${index + 1}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 48);

    return {
      id: String(item.id ?? `asset-${index + 1}`).slice(0, 64),
      name: String(item.name ?? `asset-${index + 1}.png`).slice(0, 120),
      label: rawLabel || `asset-${index + 1}`,
      mimeType,
      sizeBytes: Number(item.sizeBytes) || approxBytes,
      base64: cleanBase64,
    };
  });
}

export function sanitizeRelativeFilePath(inputPath: string): string {
  const normalized = inputPath
    .replace(/\\/g, '/')
    .replace(/\0/g, '')
    .replace(/^\/+/, '')
    .trim();

  if (!normalized) {
    throw new InputValidationError('File path cannot be empty.');
  }

  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((seg) => seg === '..' || seg === '.')) {
    throw new InputValidationError(`Invalid file path segment in "${inputPath}".`);
  }

  return segments.join('/');
}
