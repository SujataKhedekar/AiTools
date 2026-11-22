export type AllowedImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

export type MultiScreenshotRelation =
  | 'different_pages'
  | 'responsive_breakpoints'
  | 'page_states';

export type FrameworkId =
  | 'react_tailwind'
  | 'nextjs_tailwind'
  | 'nextjs_app'
  | 'react'
  | 'html_css_js'
  | 'bootstrap'
  | 'vue';

export type LanguageChoice = 'typescript' | 'javascript';
export type StylingChoice = 'tailwind' | 'css_modules' | 'vanilla_css';
export type ArchitectureChoice = 'component_based' | 'functional';

export interface ScreenshotInput {
  id: string;
  name: string;
  mimeType: AllowedImageMime;
  sizeBytes: number;
  base64: string;
  roleLabel: string; // e.g., "Desktop Homepage", "Mobile View", "Dashboard"
  width?: number;
  height?: number;
}

export interface BrandAssetInput {
  id: string;
  name: string;
  label: string; // e.g., "logo", "hero-product", "avatar"
  mimeType: AllowedImageMime;
  sizeBytes: number;
  base64: string;
}

export interface GenerationOptions {
  framework: FrameworkId;
  language: LanguageChoice;
  styling: StylingChoice;
  architecture: ArchitectureChoice;
  multiScreenshotRelation: MultiScreenshotRelation;
}

export interface ObservedLayout {
  structure: string;
  headerNav: string;
  heroSection: string;
  contentSections: string[];
  columnsAndGrids: string;
  sidebars: string;
  footer: string;
  containersAndSpacing: string;
  alignment: string;
}

export interface ObservedVisualDesign {
  backgroundColors: string[];
  textColors: string[];
  brandColors: string[];
  fontStyles: string[];
  borderRadius: string[];
  shadows: string[];
  borders: string[];
  gradients: string[];
}

export interface ObservedComponent {
  name: string;
  type: string;
  count: number;
  interactiveBehavior: string;
  observedDetails: string;
}

export interface ObservedTypography {
  headingHierarchy: string[];
  bodyTypography: string;
  lineHeight: string;
  letterSpacing: string;
  textAlignment: string;
}

export interface InferredResponsiveBehavior {
  desktopLayout: string;
  tabletLayout: string;
  mobileLayout: string;
  breakpointChanges: string[];
  stackingBehavior: string;
  responsiveNavigation: string;
}

export interface AssetSubstitution {
  originalElement: string;
  substitutionNote: string;
}

export interface DesignAnalysis {
  summary: string;
  pageType: string;
  observed: {
    layout: ObservedLayout;
    visualDesign: ObservedVisualDesign;
    components: ObservedComponent[];
    typography: ObservedTypography;
  };
  inferred: {
    responsiveBehavior: InferredResponsiveBehavior;
    assetSubstitutions: AssetSubstitution[];
  };
}

export interface ColorToken {
  name: string;
  hex: string;
  usage: string;
}

export interface TypographyScaleToken {
  role: string;
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    palette: ColorToken[];
  };
  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;
    scale: TypographyScaleToken[];
  };
  spacing: {
    baseUnit: string;
    scale: string[];
    containerMaxWidth: string;
    sectionPadding: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  buttonStyles: {
    primary: string;
    secondary: string;
  };
  cardStyles: {
    background: string;
    border: string;
    radius: string;
    shadow: string;
    padding: string;
  };
  cssVariables: string;
  tailwindConfig: string;
}

export interface ComponentPlanItem {
  name: string;
  filePath: string;
  responsibility: string;
  reusedAcrossScreenshots: boolean;
  propsSummary: string;
  interactiveFeatures: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: 'tsx' | 'ts' | 'jsx' | 'js' | 'css' | 'html' | 'json' | 'md' | 'vue';
  description?: string;
}

export interface QualityCheck {
  name: string;
  category: 'compilation' | 'accessibility' | 'semantics' | 'responsive' | 'security' | 'assets';
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  filePath?: string;
}

export interface CodeQualityReport {
  overallStatus: 'clean' | 'warnings' | 'errors';
  issuesFixed: string[];
  checks: QualityCheck[];
  compilationErrors: string[];
}

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  model: string;
}

export interface AnalyzeDesignResponse {
  analysis: DesignAnalysis;
  designSystem: DesignSystem;
  componentPlan: ComponentPlanItem[];
  tokenUsage: TokenUsage;
}

export interface GenerateCodeResponse {
  files: GeneratedFile[];
  qualityReport: CodeQualityReport;
  previewHtml: string;
  previewErrors: string[];
  tokenUsage: TokenUsage;
}

export interface IterativeEditResponse {
  files: GeneratedFile[];
  modifiedPaths: string[];
  summary: string;
  qualityReport: CodeQualityReport;
  previewHtml: string;
  previewErrors: string[];
  tokenUsage: TokenUsage;
}

export interface PreviewCompileResponse {
  previewHtml: string;
  errors: string[];
  qualityReport: CodeQualityReport;
}

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  instruction: string;
  summary: string;
  files: GeneratedFile[];
}

export interface FrameworkMeta {
  id: FrameworkId;
  label: string;
  defaultLanguage: LanguageChoice;
  defaultStyling: StylingChoice;
  description: string;
  entryHint: string;
}

export const FRAMEWORK_OPTIONS: FrameworkMeta[] = [
  {
    id: 'react_tailwind',
    label: 'React + Tailwind CSS',
    defaultLanguage: 'typescript',
    defaultStyling: 'tailwind',
    description: 'Modular React components styled with Tailwind CSS utility classes and design tokens.',
    entryHint: 'src/App.tsx',
  },
  {
    id: 'nextjs_tailwind',
    label: 'Next.js + Tailwind CSS',
    defaultLanguage: 'typescript',
    defaultStyling: 'tailwind',
    description: 'Next.js App Router structure with app/page.tsx, layout.tsx, and Tailwind tokens.',
    entryHint: 'src/app/page.tsx',
  },
  {
    id: 'nextjs_app',
    label: 'Next.js App Router',
    defaultLanguage: 'typescript',
    defaultStyling: 'css_modules',
    description: 'Next.js App Router using modular CSS Modules and clean Server/Client boundaries.',
    entryHint: 'src/app/page.tsx',
  },
  {
    id: 'react',
    label: 'React',
    defaultLanguage: 'typescript',
    defaultStyling: 'css_modules',
    description: 'Component-based React SPA with isolated CSS Modules or vanilla CSS stylesheets.',
    entryHint: 'src/App.tsx',
  },
  {
    id: 'html_css_js',
    label: 'HTML + CSS + JS',
    defaultLanguage: 'javascript',
    defaultStyling: 'vanilla_css',
    description: 'Semantic HTML5, modular CSS custom properties, and progressive vanilla JavaScript.',
    entryHint: 'index.html',
  },
  {
    id: 'bootstrap',
    label: 'Bootstrap',
    defaultLanguage: 'javascript',
    defaultStyling: 'vanilla_css',
    description: 'Responsive Bootstrap 5 grid layout with custom theme overrides and interactive JS.',
    entryHint: 'index.html',
  },
  {
    id: 'vue',
    label: 'Vue.js',
    defaultLanguage: 'typescript',
    defaultStyling: 'vanilla_css',
    description: 'Vue 3 Single File Components (SFC) with Composition API and scoped component styling.',
    entryHint: 'src/App.vue',
  },
];
