export type QRContentType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'sms'
  | 'location'
  | 'social';

export type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'facebook'
  | 'github';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface QRContentData {
  url: {
    value: string;
  };
  text: {
    value: string;
  };
  email: {
    to: string;
    subject: string;
    body: string;
  };
  phone: {
    number: string;
  };
  whatsapp: {
    phone: string;
    message: string;
  };
  wifi: {
    ssid: string;
    password: string;
    encryption: WifiEncryption;
    hidden: boolean;
  };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  sms: {
    phone: string;
    message: string;
  };
  location: {
    mode: 'coordinates' | 'place';
    latitude: string;
    longitude: string;
    placeQuery: string;
  };
  social: {
    platform: SocialPlatform;
    handle: string;
  };
}

export type ModuleStyle =
  | 'square'
  | 'rounded'
  | 'dots'
  | 'extra-rounded'
  | 'classy'
  | 'classy-rounded'
  | 'vertical-bars'
  | 'horizontal-bars';

export type CornerSquareStyle =
  | 'square'
  | 'rounded'
  | 'extra-rounded'
  | 'dot'
  | 'classy'
  | 'leaf';

export type CornerDotStyle =
  | 'square'
  | 'rounded'
  | 'dot'
  | 'diamond'
  | 'classy';

export type GradientType = 'linear' | 'radial';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type LogoContainerShape = 'square' | 'rounded' | 'circle';

export type FramePresetId =
  | 'none'
  | 'scan-me'
  | 'scan-here'
  | 'open-website'
  | 'visit-us'
  | 'follow-us'
  | 'custom';

export type FrameVisualStyle = 'banner' | 'card' | 'outline' | 'pill';

export type FramePosition = 'bottom' | 'top';

export type FrameFontWeight = 500 | 600 | 700 | 800;

export type PreviewBackdrop = 'grid' | 'white' | 'dark' | 'transparent';

export interface QRStyleConfig {
  // Colors
  fgMode: 'solid' | 'gradient';
  fgColor: string;
  gradientType: GradientType;
  gradientStart: string;
  gradientEnd: string;
  gradientRotation: number; // degrees 0-360
  bgColor: string;
  bgTransparent: boolean;

  // Modules & spacing
  moduleStyle: ModuleStyle;
  quietZone: number; // 0 to 8 modules

  // Corners
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  useCustomCornerColors: boolean;
  cornerSquareColor: string;
  cornerDotColor: string;

  // Logo
  logoDataUrl: string | null;
  logoFileName: string | null;
  logoSize: number; // percentage of QR width (12 - 34)
  logoPadding: number; // px relative to 512px base (0 - 24)
  logoBgEnabled: boolean;
  logoBgColor: string;
  logoShape: LogoContainerShape;
  logoOffsetX: number; // -12 to +12 (% of QR width)
  logoOffsetY: number; // -12 to +12 (% of QR width)
  logoExcavate: boolean;

  // Frame & Label
  framePreset: FramePresetId;
  frameStyle: FrameVisualStyle;
  frameText: string;
  frameColor: string;
  frameTextColor: string;
  frameFontSize: number; // 14 - 32
  frameFontWeight: FrameFontWeight;
  framePosition: FramePosition;
  frameRadius: number; // 0 - 32

  // Error Correction
  errorCorrection: ErrorCorrectionLevel;
  autoErrorCorrection: boolean;
}

export interface QRDesignRecord {
  id: string;
  title: string;
  updatedAt: number;
  contentType: QRContentType;
  content: QRContentData;
  style: QRStyleConfig;
  activeTemplateId: string | null;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  previewSwatches: [string, string, string];
  stylePatch: Partial<QRStyleConfig>;
}

export interface ReadabilityReport {
  status: 'optimal' | 'caution' | 'warning';
  label: string;
  contrastRatio: number;
  effectiveEC: ErrorCorrectionLevel;
  moduleCount: number;
  version: number;
  payloadLength: number;
  logoCoveragePct: number;
  tips: string[];
}

export interface ExportSettings {
  format: 'png' | 'svg';
  scalePreset: '1x' | '2x' | '4x' | 'custom';
  customWidth: number;
  transparentBg: boolean;
  includeFrame: boolean;
}
