import type {
  AnalyzeDesignResponse,
  BrandAssetInput,
  ComponentPlanItem,
  DesignAnalysis,
  DesignSystem,
  GenerateCodeResponse,
  GeneratedFile,
  GenerationOptions,
  IterativeEditResponse,
  PreviewCompileResponse,
  ScreenshotInput,
  TokenUsage,
} from '../shared/types';

export interface CodeExplanationResponse {
  overview: string;
  responsibilities: string[];
  propsAndState: string[];
  stylingAndResponsiveness: string;
  accessibilityNotes: string[];
  tokenUsage: TokenUsage;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`);
  }
  return data as T;
}

export function analyzeDesignApi(payload: {
  screenshots: ScreenshotInput[];
  assets: BrandAssetInput[];
  options: GenerationOptions;
}): Promise<AnalyzeDesignResponse> {
  return postJson<AnalyzeDesignResponse>('/api/image-to-code/analyze', payload);
}

export function generateCodeApi(payload: {
  screenshots: ScreenshotInput[];
  assets: BrandAssetInput[];
  options: GenerationOptions;
  analysis: DesignAnalysis;
  designSystem: DesignSystem;
  componentPlan: ComponentPlanItem[];
}): Promise<GenerateCodeResponse> {
  return postJson<GenerateCodeResponse>('/api/image-to-code/generate', payload);
}

export function iterativeEditApi(payload: {
  instruction: string;
  targetFilePath?: string;
  files: GeneratedFile[];
  options: GenerationOptions;
  designSystem?: DesignSystem;
  assets: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  return postJson<IterativeEditResponse>('/api/image-to-code/edit', payload);
}

export function regenerateComponentApi(payload: {
  filePath: string;
  instruction?: string;
  files: GeneratedFile[];
  options: GenerationOptions;
  designSystem?: DesignSystem;
  assets: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  return postJson<IterativeEditResponse>('/api/image-to-code/regenerate-component', payload);
}

export function explainComponentApi(payload: {
  file: GeneratedFile;
  options: GenerationOptions;
}): Promise<CodeExplanationResponse> {
  return postJson<CodeExplanationResponse>('/api/image-to-code/explain', payload);
}

export function fixErrorsApi(payload: {
  errors: string[];
  files: GeneratedFile[];
  options: GenerationOptions;
  assets: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  return postJson<IterativeEditResponse>('/api/image-to-code/fix-errors', payload);
}

export function compilePreviewApi(payload: {
  files: GeneratedFile[];
  options: GenerationOptions;
  assets: BrandAssetInput[];
}): Promise<PreviewCompileResponse> {
  return postJson<PreviewCompileResponse>('/api/image-to-code/preview/compile', payload);
}
