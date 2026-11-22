export type FontCategory = 'serif' | 'sans' | 'display' | 'mono';

export interface FontEntry {
  family: string;
  category: FontCategory;
  fallback: string;
  weights: number[];
  hasItalic: boolean;
  designer: string;
  character: string;
  recommendedRole: ('heading' | 'body' | 'accent')[];
}

export interface FontSlotConfig {
  family: string;
  weight: number;
  size: number;
  lineHeight: number;
  letterSpacing: number;
  italic?: boolean;
}

export interface SpecimenPalette {
  id: string;
  name: string;
  background: string;
  surface: string;
  border: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  accentColor: string;
}

export interface PairingState {
  heading: FontSlotConfig;
  body: FontSlotConfig & { measure: number };
  accent: {
    family: string;
    weight: number;
    letterSpacing: number;
  };
  palette: SpecimenPalette;
  locked: {
    heading: boolean;
    body: boolean;
    accent: boolean;
  };
}

export type CuratedMood =
  | 'All'
  | 'Editorial'
  | 'Modern SaaS'
  | 'Luxury'
  | 'Technical'
  | 'Bold Display';

export interface CuratedPairing {
  id: string;
  name: string;
  mood: Exclude<CuratedMood, 'All'>;
  headingFamily: string;
  headingWeight: number;
  headingTracking: number;
  bodyFamily: string;
  bodyWeight: number;
  accentFamily: string;
  rationale: string;
  sampleHeadline: string;
  sampleBody: string;
  paletteId: string;
}

export interface SavedPairing {
  id: string;
  name: string;
  savedAt: string;
  state: PairingState;
}

export type PreviewTemplate = 'editorial' | 'landing' | 'specimen' | 'ui';

export type ActiveTab = 'workbench' | 'curated' | 'scale' | 'saved';

export interface SpecimenCopy {
  id: string;
  label: string;
  kicker: string;
  headline: string;
  deck: string;
  bodyOne: string;
  bodyTwo: string;
  pullQuote: string;
  byline: string;
  ctaPrimary: string;
  ctaSecondary: string;
}
