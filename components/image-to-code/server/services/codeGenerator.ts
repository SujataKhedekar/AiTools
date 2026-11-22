import { ThinkingLevel, Type } from '@google/genai';
import type {
  BrandAssetInput,
  ComponentPlanItem,
  DesignAnalysis,
  DesignSystem,
  FrameworkId,
  GenerateCodeResponse,
  GeneratedFile,
  GenerationOptions,
  ScreenshotInput,
} from '../../shared/types';
import { sanitizeRelativeFilePath } from '../../shared/validation';
import {
  DEFAULT_MULTIMODAL_MODEL,
  extractTokenUsage,
  getGeminiClient,
  mergeTokenUsage,
  safeJsonParse,
  withGeminiRetry,
} from '../gemini/client';
import { analyzeCodeQuality } from './codeQualityAnalyzer';
import { compilePreviewBundle } from './previewBuilder';

const GENERATED_FILES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING },
          content: { type: Type.STRING },
          language: {
            type: Type.STRING,
            description: 'One of: tsx, ts, jsx, js, css, html, json, md, vue',
          },
          description: { type: Type.STRING },
        },
        required: ['path', 'content', 'language'],
      },
    },
  },
  required: ['files'],
};

function inferLanguageFromPath(
  filePath: string,
  declared?: string
): GeneratedFile['language'] {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'ts';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js')) return 'js';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.vue')) return 'vue';
  if (
    declared === 'tsx' ||
    declared === 'ts' ||
    declared === 'jsx' ||
    declared === 'js' ||
    declared === 'css' ||
    declared === 'html' ||
    declared === 'json' ||
    declared === 'md' ||
    declared === 'vue'
  ) {
    return declared;
  }
  return 'tsx';
}

export function normalizeGeneratedFiles(rawFiles: GeneratedFile[]): GeneratedFile[] {
  const deduped = new Map<string, GeneratedFile>();
  for (const f of rawFiles) {
    try {
      const cleanPath = sanitizeRelativeFilePath(f.path);
      deduped.set(cleanPath, {
        path: cleanPath,
        content: f.content,
        language: inferLanguageFromPath(cleanPath, f.language),
        description: f.description,
      });
    } catch {
      // Skip invalid paths
    }
  }
  return Array.from(deduped.values());
}

function getFrameworkStructureGuide(
  framework: FrameworkId,
  language: 'typescript' | 'javascript',
  styling: 'tailwind' | 'css_modules' | 'vanilla_css'
): string {
  const ext = language === 'typescript' ? 'tsx' : 'jsx';
  const cssExt = styling === 'css_modules' ? '.module.css' : '.css';

  switch (framework) {
    case 'nextjs_tailwind':
      return `Generate a Next.js App Router + Tailwind CSS project:
- src/app/layout.${ext} (root layout importing ./globals.css)
- src/app/page.${ext} (main entry composing modular components from ../components/*; MUST export default function Page() and include 'use client' if using interactive state)
- src/app/globals.css (design system :root CSS variables + @import "tailwindcss";)
- src/components/*.${ext} (Header, Hero, Feature/Product/Dashboard sections, Footer — modular, reusable)
- package.json, README.md`;

    case 'nextjs_app':
      return `Generate a Next.js App Router project with ${styling === 'css_modules' ? 'CSS Modules' : 'CSS'}:
- src/app/layout.${ext}
- src/app/page.${ext} (default export, 'use client' for interactive UI)
- src/styles/globals.css (design tokens :root CSS variables + base reset)
- src/components/*${ext} + src/components/*${cssExt}
- package.json, README.md`;

    case 'react_tailwind':
      return `Generate a React + Vite + Tailwind CSS project:
- src/App.${ext} (default export composing modular components from ./components/*)
- src/main.${ext}
- src/styles/globals.css (design tokens :root CSS variables + @import "tailwindcss";)
- src/components/*.${ext} (Header, Navigation, Hero, Sections, Cards, Footer — modular, reusable)
- package.json, README.md`;

    case 'react':
      return `Generate a React + Vite project using ${styling === 'css_modules' ? 'CSS Modules' : 'modular CSS'}:
- src/App.${ext} (default export composing modular components)
- src/main.${ext}
- src/styles/tokens.css (design system CSS variables)
- src/components/*.${ext} and corresponding *${cssExt} stylesheets
- package.json, README.md`;

    case 'html_css_js':
      return `Generate a clean semantic HTML5 + CSS3 + Vanilla JavaScript project:
- index.html (semantic landmarks, responsive viewport meta, linked styles/tokens.css & styles/main.css, scripts/app.js)
- styles/tokens.css (:root CSS custom properties)
- styles/main.css (modular layout, components, responsive @media breakpoints)
- scripts/app.js (functional interactive UI: mobile drawer, dropdowns, tabs, form validation, search/filter)
- README.md`;

    case 'bootstrap':
      return `Generate a Bootstrap 5 responsive project:
- index.html (semantic Bootstrap 5 grid/components + custom theme CSS + interactive JS)
- styles/theme.css (design token CSS variables and Bootstrap theme overrides)
- scripts/main.js (interactive menus, modal triggers, form validation, filters)
- README.md`;

    case 'vue':
      return `Generate a Vue 3 Composition API project:
- src/App.vue (root layout composing modular components)
- src/components/*.vue (modular Single File Components with <template>, <script setup>, and <style scoped>)
- src/styles/tokens.css (:root CSS custom properties)
- package.json, README.md`;
  }
}

export async function generateFrontendProject(params: {
  screenshots: ScreenshotInput[];
  assets: BrandAssetInput[];
  options: GenerationOptions;
  analysis: DesignAnalysis;
  designSystem: DesignSystem;
  componentPlan: ComponentPlanItem[];
}): Promise<GenerateCodeResponse> {
  const { screenshots, assets, options, analysis, designSystem, componentPlan } = params;
  const ai = getGeminiClient();

  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
  screenshots.forEach((shot, idx) => {
    parts.push({ text: `Reference Screenshot ${idx + 1} (${shot.roleLabel || shot.name}):` });
    parts.push({ inlineData: { mimeType: shot.mimeType, data: shot.base64 } });
  });

  const assetInstructions =
    assets.length > 0
      ? `Uploaded brand assets available at runtime under /assets/<label>:
${assets.map((a) => `- Use src="/assets/${a.label}" for "${a.label}" (${a.name})`).join('\n')}`
      : `No external assets were uploaded. For photographic/illustration slots, render crisp inline SVG illustrations or styled CSS/SVG placeholder frames with descriptive alt/aria-label attributes. NEVER fabricate URLs to unsplash.com, via.placeholder.com, picsum.photos, or external CDNs.`;

  const iconGuidance =
    options.framework === 'html_css_js' || options.framework === 'bootstrap' || options.framework === 'vue'
      ? 'Use clean inline SVG icons (stroke-width 1.75, crisp 20px-24px).'
      : 'Use lucide-react icons where standard UI icons appear, or crisp inline SVG for brand logos.';

  const structureGuide = getFrameworkStructureGuide(
    options.framework,
    options.language,
    options.styling
  );

  const prompt = `Reconstruct the attached UI screenshot(s) into production-grade, modular, responsive frontend code.

TARGET STACK & ARCHITECTURE:
- Framework: ${options.framework}
- Language: ${options.language}
- Styling: ${options.styling}
- Architecture: ${options.architecture}
- Multi-screenshot relation: ${options.multiScreenshotRelation}

FILE STRUCTURE REQUIREMENTS:
${structureGuide}

DESIGN SYSTEM TOKENS TO APPLY EXACTLY:
${JSON.stringify(designSystem, null, 2)}

PLANNED MODULAR COMPONENTS:
${JSON.stringify(componentPlan, null, 2)}

DESIGN ANALYSIS SUMMARY:
${JSON.stringify(analysis, null, 2)}

ASSETS & ICONS:
${assetInstructions}
${iconGuidance}

STRICT ENGINEERING RULES:
1. Visual fidelity: Match the exact layout proportions, grid columns, color palette, typography scale, border radii, shadows, and content hierarchy observed in the screenshot(s). Do NOT invent extra sections that are not in the reference.
2. Modularity: Break the UI into meaningful, well-named components. Never dump the entire page into a single giant component.
3. Functional UI (no fake backend): Implement real interactive client-side state for navigation links/tabs, mobile menu drawer, dropdowns, modals, search/filter controls, carousels, and form validation with helpful inline feedback.
4. Compilation safety: Every import path MUST point to a file you actually generated in the "files" array, or standard packages ("react", "lucide-react", "next/link", "next/image"). Never leave undefined variables, broken relative imports, or syntax errors.
5. For React/Next.js components that use hooks (useState, useEffect, etc.), include 'use client'; at the top if Next.js App Router is selected, and ensure the entry component (src/App.${options.language === 'typescript' ? 'tsx' : 'jsx'} or src/app/page.${options.language === 'typescript' ? 'tsx' : 'jsx'}) has a default export!
6. Accessibility & Semantics: Use <header>, <nav>, <main>, <section>, <footer>, proper heading hierarchy, button/link semantics, and alt attributes on all <img> tags.
7. Include a clean package.json (for JS/TS framework stacks) and README.md with setup instructions.`;

  parts.push({ text: prompt });

  const firstResp = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: { parts },
      config: {
        systemInstruction:
          'You are a principal frontend architect and design engineer. Output strictly valid JSON containing a "files" array of complete, runnable, modular source files. Every single file must be complete with zero truncation or placeholder comments like "// rest of code".',
        responseMimeType: 'application/json',
        responseSchema: GENERATED_FILES_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    })
  );

  let totalUsage = extractTokenUsage(firstResp, DEFAULT_MULTIMODAL_MODEL);
  const parsed = safeJsonParse<{ files: GeneratedFile[] }>(firstResp.text, 'code generation');
  let files = normalizeGeneratedFiles(parsed.files ?? []);
  const issuesFixed: string[] = [];

  // Automatic Compilation & Quality Repair Pass if esbuild detects any errors
  let preview = await compilePreviewBundle({
    files,
    framework: options.framework,
    assets,
  });

  if (preview.errors.length > 0) {
    const repairPrompt = `The generated project has compilation/import errors that must be fixed immediately while preserving all visual fidelity and components:

ERRORS DETECTED:
${preview.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

CURRENT FILES:
${JSON.stringify(files, null, 2)}

Fix every broken import, missing export, syntax error, or TypeScript/JSX issue. Return the complete corrected "files" array.`;

    const repairResp = await withGeminiRetry(() =>
      ai.models.generateContent({
        model: DEFAULT_MULTIMODAL_MODEL,
        contents: repairPrompt,
        config: {
          systemInstruction:
            'You are a senior TypeScript and frontend build engineer. Return strictly valid JSON with the repaired complete "files" array.',
          responseMimeType: 'application/json',
          responseSchema: GENERATED_FILES_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      })
    );

    totalUsage = mergeTokenUsage(totalUsage, extractTokenUsage(repairResp, DEFAULT_MULTIMODAL_MODEL));
    const repairedParsed = safeJsonParse<{ files: GeneratedFile[] }>(
      repairResp.text,
      'auto-repair pass'
    );
    const repairedFiles = normalizeGeneratedFiles(repairedParsed.files ?? []);
    if (repairedFiles.length > 0) {
      files = repairedFiles;
      issuesFixed.push(
        `Auto-repaired ${preview.errors.length} initial compilation/import issue(s) before final delivery.`
      );
      preview = await compilePreviewBundle({
        files,
        framework: options.framework,
        assets,
      });
    }
  }

  const qualityReport = await analyzeCodeQuality(files, options.framework, issuesFixed);

  return {
    files,
    qualityReport,
    previewHtml: preview.previewHtml,
    previewErrors: preview.errors,
    tokenUsage: totalUsage,
  };
}
