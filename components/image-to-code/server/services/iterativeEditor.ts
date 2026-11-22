import { ThinkingLevel, Type } from '@google/genai';
import type {
  BrandAssetInput,
  DesignSystem,
  FrameworkId,
  GeneratedFile,
  IterativeEditResponse,
  TokenUsage,
} from '../../shared/types';
import {
  DEFAULT_MULTIMODAL_MODEL,
  extractTokenUsage,
  getGeminiClient,
  safeJsonParse,
  withGeminiRetry,
} from '../gemini/client';
import { normalizeGeneratedFiles } from './codeGenerator';
import { analyzeCodeQuality } from './codeQualityAnalyzer';
import { compilePreviewBundle } from './previewBuilder';

const EDIT_FILES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    updatedFiles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING },
          content: { type: Type.STRING },
          language: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['path', 'content', 'language'],
      },
    },
  },
  required: ['summary', 'updatedFiles'],
};

const EXPLAIN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
    propsAndState: { type: Type.ARRAY, items: { type: Type.STRING } },
    stylingAndResponsiveness: { type: Type.STRING },
    accessibilityNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'overview',
    'responsibilities',
    'propsAndState',
    'stylingAndResponsiveness',
    'accessibilityNotes',
  ],
};

function mergeUpdatedFiles(
  existingFiles: GeneratedFile[],
  updatedFiles: GeneratedFile[]
): { merged: GeneratedFile[]; modifiedPaths: string[] } {
  const normalizedUpdates = normalizeGeneratedFiles(updatedFiles);
  const map = new Map<string, GeneratedFile>();
  for (const f of existingFiles) {
    map.set(f.path, f);
  }
  const modifiedPaths: string[] = [];
  for (const uf of normalizedUpdates) {
    map.set(uf.path, uf);
    modifiedPaths.push(uf.path);
  }
  return { merged: Array.from(map.values()), modifiedPaths };
}

export async function applyIterativeEdit(params: {
  instruction: string;
  targetFilePath?: string;
  files: GeneratedFile[];
  framework: FrameworkId;
  designSystem?: DesignSystem;
  assets?: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  const { instruction, targetFilePath, files, framework, designSystem, assets = [] } = params;
  const ai = getGeminiClient();

  const targetHint = targetFilePath
    ? `Focus edits on "${targetFilePath}" (and only touch other files if imports or styles require it).`
    : 'Modify ONLY the relevant component/style files needed for this change. Preserve all unrelated working code.';

  const prompt = `Apply the following user refinement instruction to this existing ${framework} project:

USER INSTRUCTION: "${instruction}"
${targetHint}

DESIGN SYSTEM REFERENCE:
${designSystem ? JSON.stringify(designSystem.colors, null, 2) : 'Preserve existing design tokens.'}

CURRENT PROJECT FILES:
${JSON.stringify(
  files.map((f) => ({ path: f.path, language: f.language, content: f.content })),
  null,
  2
)}

Return ONLY the files that were modified or newly created in "updatedFiles", along with a concise 1-2 sentence "summary" of what changed. Do NOT return unchanged files.`;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a careful senior frontend engineer making surgical improvements to an existing codebase. Never break imports, types, or existing interactive features. Return complete file contents for every file in updatedFiles.',
        responseMimeType: 'application/json',
        responseSchema: EDIT_FILES_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  const parsed = safeJsonParse<{ summary: string; updatedFiles: GeneratedFile[] }>(
    response.text,
    'iterative edit'
  );

  const { merged, modifiedPaths } = mergeUpdatedFiles(files, parsed.updatedFiles ?? []);
  const preview = await compilePreviewBundle({ files: merged, framework, assets });
  const qualityReport = await analyzeCodeQuality(merged, framework);

  return {
    files: merged,
    modifiedPaths,
    summary: parsed.summary || 'Applied requested edits.',
    qualityReport,
    previewHtml: preview.previewHtml,
    previewErrors: preview.errors,
    tokenUsage: extractTokenUsage(response, DEFAULT_MULTIMODAL_MODEL),
  };
}

export async function regenerateSingleComponent(params: {
  filePath: string;
  instruction?: string;
  files: GeneratedFile[];
  framework: FrameworkId;
  designSystem?: DesignSystem;
  assets?: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  const { filePath, instruction, files, framework, designSystem, assets = [] } = params;
  const targetFile = files.find((f) => f.path === filePath);
  if (!targetFile) {
    throw new Error(`File "${filePath}" not found in project.`);
  }

  const prompt = `Regenerate and improve the single component file "${filePath}" for this ${framework} project.
${instruction ? `Specific guidance: "${instruction}"` : 'Refine its visual fidelity, responsiveness, accessibility, and clean component structure while preserving all exported names and props used by parent files.'}

CURRENT TARGET FILE (${filePath}):
${targetFile.content}

OTHER FILES (for import/export compatibility context):
${JSON.stringify(
  files.filter((f) => f.path !== filePath).map((f) => ({ path: f.path, content: f.content.slice(0, 1200) })),
  null,
  2
)}

${designSystem ? `DESIGN TOKENS:\n${JSON.stringify(designSystem.colors)}` : ''}

Return ONLY "${filePath}" (and its matching stylesheet if applicable) in updatedFiles.`;

  const ai = getGeminiClient();
  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a frontend component architect. Preserve exported symbol signatures so imports across the project continue compiling cleanly.',
        responseMimeType: 'application/json',
        responseSchema: EDIT_FILES_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  const parsed = safeJsonParse<{ summary: string; updatedFiles: GeneratedFile[] }>(
    response.text,
    'component regeneration'
  );

  const { merged, modifiedPaths } = mergeUpdatedFiles(files, parsed.updatedFiles ?? []);
  const preview = await compilePreviewBundle({ files: merged, framework, assets });
  const qualityReport = await analyzeCodeQuality(merged, framework);

  return {
    files: merged,
    modifiedPaths,
    summary: parsed.summary || `Regenerated ${filePath}.`,
    qualityReport,
    previewHtml: preview.previewHtml,
    previewErrors: preview.errors,
    tokenUsage: extractTokenUsage(response, DEFAULT_MULTIMODAL_MODEL),
  };
}

export async function fixCompilationErrors(params: {
  errors: string[];
  files: GeneratedFile[];
  framework: FrameworkId;
  assets?: BrandAssetInput[];
}): Promise<IterativeEditResponse> {
  const { errors, files, framework, assets = [] } = params;
  const ai = getGeminiClient();

  const prompt = `Fix the following compilation/preview errors in this ${framework} project while keeping all existing UI features and design intact:

ERRORS:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

PROJECT FILES:
${JSON.stringify(files, null, 2)}

Return ONLY the fixed files in "updatedFiles" and summarize the fix.`;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a TypeScript and React/Next.js/Vue build troubleshooter. Fix all syntax, missing import, and export mismatches.',
        responseMimeType: 'application/json',
        responseSchema: EDIT_FILES_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  const parsed = safeJsonParse<{ summary: string; updatedFiles: GeneratedFile[] }>(
    response.text,
    'error auto-fix'
  );

  const { merged, modifiedPaths } = mergeUpdatedFiles(files, parsed.updatedFiles ?? []);
  const preview = await compilePreviewBundle({ files: merged, framework, assets });
  const qualityReport = await analyzeCodeQuality(merged, framework, [
    parsed.summary || 'Resolved compilation issues.',
  ]);

  return {
    files: merged,
    modifiedPaths,
    summary: parsed.summary || 'Fixed compilation errors.',
    qualityReport,
    previewHtml: preview.previewHtml,
    previewErrors: preview.errors,
    tokenUsage: extractTokenUsage(response, DEFAULT_MULTIMODAL_MODEL),
  };
}

export interface CodeExplanation {
  overview: string;
  responsibilities: string[];
  propsAndState: string[];
  stylingAndResponsiveness: string;
  accessibilityNotes: string[];
  tokenUsage: TokenUsage;
}

export async function explainComponentFile(params: {
  file: GeneratedFile;
  framework: FrameworkId;
}): Promise<CodeExplanation> {
  const { file, framework } = params;
  const ai = getGeminiClient();

  const prompt = `Explain the following ${framework} file ("${file.path}") clearly for a developer:

\`\`\`${file.language}
${file.content}
\`\`\``;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'Provide concise, technical, developer-focused explanations of component architecture, state, styling, and accessibility.',
        responseMimeType: 'application/json',
        responseSchema: EXPLAIN_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
  );

  const parsed = safeJsonParse<Omit<CodeExplanation, 'tokenUsage'>>(
    response.text,
    'code explanation'
  );

  return {
    ...parsed,
    tokenUsage: extractTokenUsage(response, DEFAULT_MULTIMODAL_MODEL),
  };
}
