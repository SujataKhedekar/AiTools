import { Code2, Play, ScanSearch } from 'lucide-react';
import {
  FRAMEWORK_OPTIONS,
  type ArchitectureChoice,
  type FrameworkId,
  type GenerationOptions,
  type LanguageChoice,
  type StylingChoice,
} from '../shared/types';

interface FrameworkControlsProps {
  options: GenerationOptions;
  onChangeOptions: (next: GenerationOptions) => void;
  hasScreenshots: boolean;
  hasAnalysis: boolean;
  isAnalyzing: boolean;
  isGenerating: boolean;
  onAnalyzeOnly: () => void;
  onGenerateFull: () => void;
}

export function FrameworkControls({
  options,
  onChangeOptions,
  hasScreenshots,
  hasAnalysis,
  isAnalyzing,
  isGenerating,
  onAnalyzeOnly,
  onGenerateFull,
}: FrameworkControlsProps) {
  const selectedMeta = FRAMEWORK_OPTIONS.find((f) => f.id === options.framework);
  const isStatic = options.framework === 'html_css_js' || options.framework === 'bootstrap';

  function handleFrameworkChange(frameworkId: FrameworkId) {
    const meta = FRAMEWORK_OPTIONS.find((f) => f.id === frameworkId);
    if (!meta) return;
    onChangeOptions({
      ...options,
      framework: frameworkId,
      language: meta.defaultLanguage,
      styling: meta.defaultStyling,
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5">
      <div>
        <label
          htmlFor="framework-select"
          className="block text-xs font-semibold text-slate-800 mb-1.5"
        >
          Target Framework &amp; Stack
        </label>
        <select
          id="framework-select"
          value={options.framework}
          onChange={(e) => handleFrameworkChange(e.target.value as FrameworkId)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
        >
          {FRAMEWORK_OPTIONS.map((fw) => (
            <option key={fw.id} value={fw.id}>
              {fw.label}
            </option>
          ))}
        </select>
        {selectedMeta && (
          <p className="mt-1.5 text-xs text-slate-500">{selectedMeta.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label
            htmlFor="language-select"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Language
          </label>
          <select
            id="language-select"
            value={options.language}
            disabled={isStatic}
            onChange={(e) =>
              onChangeOptions({ ...options, language: e.target.value as LanguageChoice })
            }
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 disabled:opacity-60 focus:border-blue-500 focus:outline-none"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="styling-select"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Styling
          </label>
          <select
            id="styling-select"
            value={options.styling}
            onChange={(e) =>
              onChangeOptions({ ...options, styling: e.target.value as StylingChoice })
            }
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="tailwind">Tailwind CSS</option>
            <option value="css_modules">CSS Modules</option>
            <option value="vanilla_css">Vanilla CSS</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="arch-select"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Architecture
          </label>
          <select
            id="arch-select"
            value={options.architecture}
            onChange={(e) =>
              onChangeOptions({
                ...options,
                architecture: e.target.value as ArchitectureChoice,
              })
            }
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="component_based">Components</option>
            <option value="functional">Functional</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!hasScreenshots || isAnalyzing || isGenerating}
          onClick={onAnalyzeOnly}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
          {isAnalyzing ? 'Analyzing Design...' : 'Analyze Design'}
        </button>

        <button
          type="button"
          disabled={!hasScreenshots || isAnalyzing || isGenerating}
          onClick={onGenerateFull}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {hasAnalysis ? (
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isGenerating
            ? 'Generating Code...'
            : hasAnalysis
              ? 'Generate Code'
              : 'Analyze & Generate'}
        </button>
      </div>
    </div>
  );
}
