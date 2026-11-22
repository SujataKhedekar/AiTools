import { FONT_CATALOG } from '../data/fonts';

const loadedFamilies = new Set<string>([
  'Plus Jakarta Sans',
  'DM Sans',
  'IBM Plex Mono',
  'Fraunces',
]);

function encodeFamilyParam(family: string): string {
  const entry = FONT_CATALOG.find((f) => f.family === family);
  const encodedName = family.trim().replace(/\s+/g, '+');
  if (!entry) {
    return `family=${encodedName}:wght@400;500;600;700`;
  }
  const weights = [...entry.weights].sort((a, b) => a - b);
  if (entry.hasItalic) {
    const regularPairs = weights.map((w) => `0,${w}`);
    const italicWeights = weights.filter((w) => w === 400 || w === 600 || w === 700);
    const italicPairs = (italicWeights.length > 0 ? italicWeights : [weights[0]]).map(
      (w) => `1,${w}`
    );
    return `family=${encodedName}:ital,wght@${[...regularPairs, ...italicPairs].join(';')}`;
  }
  return `family=${encodedName}:wght@${weights.join(';')}`;
}

export function loadGoogleFont(family: string): void {
  if (!family || loadedFamilies.has(family) || typeof document === 'undefined') {
    return;
  }
  loadedFamilies.add(family);
  const href = `https://fonts.googleapis.com/css2?${encodeFamilyParam(family)}&display=swap`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.typepairFont = family;
  document.head.appendChild(link);
}

export function loadGoogleFontsBatch(families: string[]): void {
  if (typeof document === 'undefined') return;
  const toLoad = Array.from(new Set(families)).filter(
    (family) => family && !loadedFamilies.has(family)
  );
  if (toLoad.length === 0) return;

  // Load in batches of up to 8 families to keep URL lengths safe and fast
  const chunkSize = 8;
  for (let i = 0; i < toLoad.length; i += chunkSize) {
    const chunk = toLoad.slice(i, i + chunkSize);
    chunk.forEach((f) => loadedFamilies.add(f));
    const params = chunk.map((f) => encodeFamilyParam(f)).join('&');
    const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.typepairBatch = chunk.join(',');
    document.head.appendChild(link);
  }
}

export function buildExportGoogleFontsUrl(
  familiesWithWeights: Array<{ family: string; weights: number[] }>
): string {
  const merged = new Map<string, Set<number>>();
  for (const item of familiesWithWeights) {
    if (!merged.has(item.family)) {
      merged.set(item.family, new Set<number>());
    }
    const set = merged.get(item.family)!;
    item.weights.forEach((w) => set.add(w));
  }

  const params: string[] = [];
  for (const [family, weightsSet] of merged.entries()) {
    const encodedName = family.trim().replace(/\s+/g, '+');
    const sortedWeights = Array.from(weightsSet).sort((a, b) => a - b);
    params.push(`family=${encodedName}:wght@${sortedWeights.join(';')}`);
  }

  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

export function getFontStack(family: string): string {
  const entry = FONT_CATALOG.find((f) => f.family === family);
  const fallback = entry ? entry.fallback : 'sans-serif';
  return `"${family}", ${fallback}`;
}
