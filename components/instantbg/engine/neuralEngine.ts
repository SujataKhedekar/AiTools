import { removeBackground } from '@imgly/background-removal';

export interface NeuralProgressEvent {
  progress: number;
  message: string;
}

/**
 * Runs client-side neural subject segmentation via ONNX Runtime Web (@imgly/background-removal)
 * and extracts a clean single-channel Uint8ClampedArray alpha matte aligned to (targetWidth, targetHeight).
 */
export async function computeNeuralAlphaMatte(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (event: NeuralProgressEvent) => void
): Promise<{ mask: Uint8ClampedArray; elapsedMs: number }> {
  const startTime = performance.now();

  const inputBlob = await new Promise<Blob>((resolve, reject) => {
    sourceCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode photo for neural matte.'));
      },
      'image/png',
      1
    );
  });

  const resultBlob = await removeBackground(inputBlob, {
    model: 'isnet_quint8',
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      const pct = total > 0 ? Math.min(99, Math.round((current / total) * 100)) : 50;
      const isFetch = key.startsWith('fetch');
      onProgress({
        progress: pct,
        message: isFetch ? `Loading neural model (${pct}%)` : `Refining subject matte (${pct}%)`,
      });
    },
  });

  const bitmapUrl = URL.createObjectURL(resultBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode neural matte output.'));
      el.src = bitmapUrl;
    });

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetWidth;
    maskCanvas.height = targetHeight;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable.');

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const rgba = ctx.getImageData(0, 0, targetWidth, targetHeight).data;

    const mask = new Uint8ClampedArray(targetWidth * targetHeight);
    for (let i = 0, j = 3; i < mask.length; i++, j += 4) {
      mask[i] = rgba[j];
    }

    return {
      mask,
      elapsedMs: Math.round(performance.now() - startTime),
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}
