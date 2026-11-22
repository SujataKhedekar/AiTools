export type ShadeLevel =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

export const SHADE_LEVELS: ShadeLevel[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

export type GenerationMode =
  | 'classic'
  | 'hue-shift'
  | 'luminance'
  | 'vivid'
  | 'muted';

export type ColourFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

export type ExportFormat =
  | 'css'
  | 'tailwind-v4'
  | 'tailwind-v3'
  | 'json'
  | 'scss'
  | 'hex';

export type WorkspaceTab = 'shades' | 'preview' | 'harmony' | 'saved';

export type SidebarSection =
  | 'tailwind-shade-generator'
  | 'home'
  | 'all-tools'
  | 'design-tools'
  | 'colour-tools'
  | 'image-tools'
  | 'ai-tools';

export interface RGB {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
}

export interface HSL {
  h: number; // 0..360
  s: number; // 0..100
  l: number; // 0..100
}

export interface OKLCH {
  l: number; // 0..1
  c: number; // 0..~0.4
  h: number; // 0..360
}

export interface ShadeEntry {
  level: ShadeLevel;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  oklch: OKLCH;
  contrastWhite: number;
  contrastDark: number;
  locked: boolean;
  isEdited: boolean;
  /** Lightness delta applied via interactive graph dragging (-0.35..0.35) */
  customLightnessOffset: number;
}

export interface ColourAdjustments {
  temperature: number; // -30..30
  saturation: number; // -50..50
  brightness: number; // -15..15
}

export interface TypographySettings {
  codeFontSize: 'sm' | 'md' | 'lg';
  uppercaseHex: boolean;
  compactRows: boolean;
}

export interface GeneratorSettings {
  anchorBaseAt500: boolean;
  gamutClamp: boolean;
  showContrastBadges: boolean;
}

export interface SavedPalette {
  id: string;
  paletteName: string;
  colourName: string;
  baseHex: string;
  mode: GenerationMode;
  adjustments: ColourAdjustments;
  shades: Record<ShadeLevel, string>;
  savedAt: string;
}

export interface PresetColour {
  name: string;
  slug: string;
  hex: string;
  family: 'cool' | 'warm' | 'neutral';
}

export type HarmonyKind =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'monochromatic';

export interface HarmonyColour {
  label: string;
  angle: string;
  hex: string;
  role: string;
}
