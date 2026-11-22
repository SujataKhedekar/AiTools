import { GeminiServiceError } from "@/components/image-to-code/server/gemini/client";
import { checkAiRateLimit, checkPreviewRateLimit } from "@/components/image-to-code/server/security/rateLimiter";
import { generateFrontendProject } from "@/components/image-to-code/server/services/codeGenerator";
import { analyzeScreenshotsDesign } from "@/components/image-to-code/server/services/designAnalyzer";
import { applyIterativeEdit, explainComponentFile, fixCompilationErrors, regenerateSingleComponent } from "@/components/image-to-code/server/services/iterativeEditor";
import { compilePreviewBundle } from "@/components/image-to-code/server/services/previewBuilder";
import type { ArchitectureChoice, ComponentPlanItem, DesignAnalysis, DesignSystem, FrameworkId, GeneratedFile, GenerationOptions, LanguageChoice, MultiScreenshotRelation, StylingChoice } from "@/components/image-to-code/shared/types";
import { InputValidationError, validateAssetInputs, validateScreenshotInputs } from "@/components/image-to-code/shared/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FRAMEWORKS = new Set<FrameworkId>(["react_tailwind", "nextjs_tailwind", "nextjs_app", "react", "html_css_js", "bootstrap", "vue"]);
const LANGUAGES = new Set<LanguageChoice>(["typescript", "javascript"]);
const STYLING = new Set<StylingChoice>(["tailwind", "css_modules", "vanilla_css"]);
const ARCHITECTURES = new Set<ArchitectureChoice>(["component_based", "functional"]);
const RELATIONS = new Set<MultiScreenshotRelation>(["different_pages", "responsive_breakpoints", "page_states"]);
const json = (body: unknown, status = 200) => Response.json(body, { status });

function optionsFrom(raw: unknown): GenerationOptions {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    framework: FRAMEWORKS.has(value.framework as FrameworkId) ? value.framework as FrameworkId : "react_tailwind",
    language: LANGUAGES.has(value.language as LanguageChoice) ? value.language as LanguageChoice : "typescript",
    styling: STYLING.has(value.styling as StylingChoice) ? value.styling as StylingChoice : "tailwind",
    architecture: ARCHITECTURES.has(value.architecture as ArchitectureChoice) ? value.architecture as ArchitectureChoice : "component_based",
    multiScreenshotRelation: RELATIONS.has(value.multiScreenshotRelation as MultiScreenshotRelation) ? value.multiScreenshotRelation as MultiScreenshotRelation : "different_pages",
  };
}

function fail(error: unknown, fallback: string) {
  if (error instanceof InputValidationError) return json({ error: error.message }, 400);
  if (error instanceof GeminiServiceError) return json({ error: error.message }, error.statusCode);
  console.error(`[Image to Code] ${fallback}`, error instanceof Error ? error.message : error);
  return json({ error: error instanceof Error ? error.message : fallback }, 500);
}

export async function POST(request: Request, context: { params: { action: string[] } }) {
  if (Number(request.headers.get("content-length") || 0) > 48 * 1024 * 1024) return json({ error: "Request is too large. Reduce the number or size of uploaded images." }, 413);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Invalid request data." }, 400); }

  const action = context.params.action.join("/");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = action === "preview/compile" ? checkPreviewRateLimit(ip) : checkAiRateLimit(ip);
  if (!rate.allowed) return json({ error: `Request limit reached. Try again in ${rate.retryAfterSeconds} seconds.` }, 429);

  try {
    if (action === "analyze") {
      const screenshots = validateScreenshotInputs(body.screenshots);
      const assets = validateAssetInputs(body.assets);
      return json(await analyzeScreenshotsDesign({ screenshots, assets, options: optionsFrom(body.options) }));
    }
    if (action === "generate") {
      const screenshots = validateScreenshotInputs(body.screenshots);
      const assets = validateAssetInputs(body.assets);
      const analysis = body.analysis as DesignAnalysis | undefined;
      const designSystem = body.designSystem as DesignSystem | undefined;
      const componentPlan = Array.isArray(body.componentPlan) ? body.componentPlan as ComponentPlanItem[] : [];
      if (!analysis || !designSystem) throw new InputValidationError("Run design analysis before generating the project.");
      return json(await generateFrontendProject({ screenshots, assets, options: optionsFrom(body.options), analysis, designSystem, componentPlan }));
    }
    if (action === "edit") {
      const instruction = String(body.instruction ?? "").trim();
      const files = Array.isArray(body.files) ? body.files as GeneratedFile[] : [];
      if (!instruction || instruction.length > 2000) throw new InputValidationError("Enter an editing instruction under 2,000 characters.");
      if (!files.length) throw new InputValidationError("No project files were provided to edit.");
      const options = optionsFrom(body.options);
      return json(await applyIterativeEdit({ instruction, targetFilePath: typeof body.targetFilePath === "string" ? body.targetFilePath : undefined, files, framework: options.framework, designSystem: body.designSystem as DesignSystem | undefined, assets: validateAssetInputs(body.assets) }));
    }
    if (action === "regenerate-component") {
      const filePath = String(body.filePath ?? "").trim();
      const files = Array.isArray(body.files) ? body.files as GeneratedFile[] : [];
      if (!filePath || !files.length) throw new InputValidationError("A component path and project files are required.");
      const options = optionsFrom(body.options);
      return json(await regenerateSingleComponent({ filePath, instruction: typeof body.instruction === "string" ? body.instruction : undefined, files, framework: options.framework, designSystem: body.designSystem as DesignSystem | undefined, assets: validateAssetInputs(body.assets) }));
    }
    if (action === "explain") {
      const file = body.file as GeneratedFile | undefined;
      if (!file || typeof file.path !== "string" || typeof file.content !== "string") throw new InputValidationError("Select a valid project file to explain.");
      return json(await explainComponentFile({ file, framework: optionsFrom(body.options).framework }));
    }
    if (action === "fix-errors") {
      const errors = Array.isArray(body.errors) ? body.errors.filter((item): item is string => typeof item === "string") : [];
      const files = Array.isArray(body.files) ? body.files as GeneratedFile[] : [];
      if (!errors.length || !files.length) throw new InputValidationError("Compilation errors and project files are required for auto-fix.");
      return json(await fixCompilationErrors({ errors, files, framework: optionsFrom(body.options).framework, assets: validateAssetInputs(body.assets) }));
    }
    if (action === "preview/compile") {
      const files = Array.isArray(body.files) ? body.files as GeneratedFile[] : [];
      if (!files.length) throw new InputValidationError("Project files are required to compile the preview.");
      return json(await compilePreviewBundle({ files, framework: optionsFrom(body.options).framework, assets: validateAssetInputs(body.assets) }));
    }
    return json({ error: "Unknown image-to-code action." }, 404);
  } catch (error) { return fail(error, `Request failed (${action}).`); }
}
