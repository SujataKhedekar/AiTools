export type ToolMode = 'compare' | 'erase' | 'restore' | 'wand' | 'pan';

export type EngineMode = 'neural' | 'smart';

export type BackdropMode = 'transparent' | 'color' | 'gradient' | 'blur' | 'image';

export type ExportFormat = 'png' | 'webp' | 'jpeg';

export type CheckerStyle = 'dark' | 'light';

export interface MatteSettings {
  /** Alpha cutoff shift (-50 to +50) applied in real time */
  threshold: number;
  /** Morphological choke/spread (-8 to +8 px) applied in real time */
  edgeShift: number;
  /** Edge feather blur radius (0 to 10 px) applied in real time */
  feather: number;
  /** Color spill decontamination on boundary pixels (0 to 100%) */
  decontaminate: number;
  /** Invert final foreground/background mask */
  invertMask: boolean;
  /** Smart Edge engine color tolerance (8 to 85) */
  smartTolerance: number;
  /** Smart Edge engine boundary protection (0 to 100) */
  smartEdgeStrength: number;
}

export interface BrushSettings {
  size: number;
  hardness: number;
  wandTolerance: number;
  wandMode: 'erase' | 'restore';
}

export interface BackdropSettings {
  mode: BackdropMode;
  color: string;
  gradientId: string;
  blurRadius: number;
  customImageUrl: string | null;
  shadowEnabled: boolean;
  shadowOpacity: number;
  shadowBlur: number;
  shadowOffsetY: number;
}

export interface PhotoItem {
  id: string;
  name: string;
  category: string;
  src: string;
  isSample?: boolean;
}

export interface NeuralStatus {
  state: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
  elapsedMs?: number;
}

export interface StudioGradient {
  id: string;
  name: string;
  css: string;
  stops: [string, string];
  angleDeg: number;
}

export const DEFAULT_MATTE_SETTINGS: MatteSettings = {
  threshold: 0,
  edgeShift: 0,
  feather: 1,
  decontaminate: 45,
  invertMask: false,
  smartTolerance: 30,
  smartEdgeStrength: 55,
};

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  size: 42,
  hardness: 72,
  wandTolerance: 28,
  wandMode: 'erase',
};

export const DEFAULT_BACKDROP_SETTINGS: BackdropSettings = {
  mode: 'transparent',
  color: '#FFFFFF',
  gradientId: 'studio-slate',
  blurRadius: 16,
  customImageUrl: null,
  shadowEnabled: false,
  shadowOpacity: 35,
  shadowBlur: 24,
  shadowOffsetY: 16,
};
