export type ElementType = 'text' | 'shape' | 'image' | 'icon' | 'chart';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  w: number; // percentage 0..100
  h: number; // percentage 0..100
  opacity?: number;
  zIndex?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number; // relative to 1280x720 canvas (px)
  fontFamily: string;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  lineHeight?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeKind: 'rect' | 'roundRect' | 'ellipse' | 'line' | 'badge';
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain';
  borderRadius?: number;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  color: string;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: ChartDataPoint[];
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  showGrid?: boolean;
}

export type SlideElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | IconElement
  | ChartElement;

export type SlideLayout =
  | 'title'
  | 'problem-solution'
  | 'market'
  | 'business-model'
  | 'competitive'
  | 'product'
  | 'timeline'
  | 'financials'
  | 'team'
  | 'closing'
  | 'content-split'
  | 'custom';

export interface Slide {
  id: string;
  title: string;
  layout: SlideLayout;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  accentColor: string;
  notes?: string;
  elements: SlideElement[];
}

export interface DeckTheme {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  secondaryAccent: string;
  fontDisplay: string;
  fontBody: string;
  gradient?: string;
}

export interface Presentation {
  id?: number;
  publicId: string;
  title: string;
  subtitle: string;
  presentationType: string;
  themeId: string;
  isFavorite: boolean;
  isPublic: boolean;
  slides: Slide[];
  googleSlidesId?: string | null;
  googleSlidesUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateDeckParams {
  prompt: string;
  title?: string;
  slideCount: number;
  presentationType: string;
  audience: string;
  language: string;
  tone: string;
  designStyle: string;
  colorPalette: string;
  instructions?: string;
}

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  plan: 'free' | 'pro' | 'business';
  generationsUsed: number;
  authProvider: 'google' | 'email';
}

export interface PresentationTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  colorTheme: string;
  themeId: string;
  slideCount: number;
  previewImage: string;
  presentationType: string;
  slides: Slide[];
}
