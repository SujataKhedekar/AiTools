import { AlertCircle, ChevronDown, Loader2, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import {
  OUTPUT_FEATURES,
  SUMMARIZATION_MODES,
  SUMMARY_FORMATS,
  SUMMARY_LANGUAGES,
  SUMMARY_LENGTHS,
  SUMMARY_TONES,
  type ExtractedFileResponse,
  type OutputFeature,
  type SummarizationMode,
  type SummaryFormat,
  type SummaryLength,
  type SummaryTone,
} from '../types/summarizer';
import { FileDropzone } from './FileDropzone';

interface InputsPanelProps {
  text: string;
  onTextChange: (val: string) => void;
  length: SummaryLength;
  onLengthChange: (val: SummaryLength) => void;
  format: SummaryFormat;
  onFormatChange: (val: SummaryFormat) => void;
  tone: SummaryTone;
  onToneChange: (val: SummaryTone) => void;
  language: string;
  onLanguageChange: (val: string) => void;
  customLanguage: string;
  onCustomLanguageChange: (val: string) => void;
  mode: SummarizationMode;
  onModeChange: (val: SummarizationMode) => void;
  feature: OutputFeature;
  onFeatureChange: (val: OutputFeature) => void;
  uploadedFile: { name: string; size: number; wordCount: number } | null;
  onFileExtracted: (data: ExtractedFileResponse) => void;
  onRemoveFile: () => void;
  onLoadSample: () => void;
  onGenerate: () => void;
  onReset: () => void;
  isGenerating: boolean;
  validationError: string | null;
}

const MAX_CHARS = 150_000;

function countWords(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function InputsPanel({
  text,
  onTextChange,
  length,
  onLengthChange,
  format,
  onFormatChange,
  tone,
  onToneChange,
  language,
  onLanguageChange,
  customLanguage,
  onCustomLanguageChange,
  mode,
  onModeChange,
  feature,
  onFeatureChange,
  uploadedFile,
  onFileExtracted,
  onRemoveFile,
  onLoadSample,
  onGenerate,
  onReset,
  isGenerating,
  validationError,
}: InputsPanelProps) {
  const charCount = text.length;
  const wordCount = countWords(text);
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = text.trim().length === 0;
  const activeModeObj = SUMMARIZATION_MODES.find((m) => m.value === mode);

  return (
    <section
      id="inputs-panel"
      aria-labelledby="inputs-heading"
      className="no-print flex flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_3px_rgba(24,24,27,0.04),0_8px_24px_rgba(24,24,27,0.03)] sm:p-6"
    >
      {/* Card Header */}
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#F1EDE4] pb-3.5">
        <h2
          id="inputs-heading"
          className="font-display text-xs font-bold tracking-[0.08em] text-[#52525B]"
        >
          INPUTS
        </h2>
        <button
          type="button"
          onClick={onLoadSample}
          disabled={isGenerating}
          className="text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        >
          Load sample text
        </button>
      </div>

      <div className="space-y-4">
        {/* Summarization Mode & Output Feature */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="summarization-mode"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Summarization Mode
            </label>
            <div className="relative">
              <select
                id="summarization-mode"
                value={mode}
                disabled={isGenerating}
                onChange={(e) => onModeChange(e.target.value as SummarizationMode)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {SUMMARIZATION_MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
            {activeModeObj && (
              <p className="mt-1 text-[11px] text-[#71717A]">{activeModeObj.hint}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="output-feature"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Output Mode
            </label>
            <div className="relative">
              <select
                id="output-feature"
                value={feature}
                disabled={isGenerating}
                onChange={(e) => onFeatureChange(e.target.value as OutputFeature)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {OUTPUT_FEATURES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#71717A]">
              Choose full summary or targeted extraction
            </p>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <FileDropzone
          uploadedFile={uploadedFile}
          onFileExtracted={onFileExtracted}
          onRemoveFile={onRemoveFile}
          disabled={isGenerating}
        />

        {/* Source Text Area */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="source-text" className="text-xs font-medium text-[#3F3F46]">
              Text to summarize <span className="text-[#DC2626]">*</span>
            </label>
            {text.length > 0 && (
              <button
                type="button"
                onClick={() => onTextChange('')}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Clear text
              </button>
            )}
          </div>

          <textarea
            id="source-text"
            rows={10}
            value={text}
            disabled={isGenerating}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste an article, transcript, or document."
            aria-invalid={Boolean(validationError) || isOverLimit}
            className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm leading-relaxed text-[#18181B] placeholder:text-[#A1A1AA] transition-colors focus:outline-none disabled:bg-[#FAF9F6] disabled:text-[#52525B] ${
              validationError || isOverLimit
                ? 'border-[#DC2626] focus:border-[#DC2626]'
                : 'border-[#E2DDD3] hover:border-[#CBC4B7] focus:border-[#4F46E5]'
            }`}
          />

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="font-mono tabular-nums text-[#71717A]">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="mx-1.5 text-[#D4D4D8]" aria-hidden="true">
                ·
              </span>
              <span className={isOverLimit ? 'font-semibold text-[#DC2626]' : ''}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
              </span>
            </div>

            {uploadedFile && (
              <span className="text-[#52525B]">
                Extracted text is editable before generating
              </span>
            )}
          </div>

          {(validationError || isOverLimit) && (
            <div
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#DC2626]"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {isOverLimit
                  ? `Text exceeds the ${MAX_CHARS.toLocaleString()} character limit.`
                  : validationError}
              </span>
            </div>
          )}
        </div>

        {/* 2x2 Summary Controls */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="summary-length"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Summary Length
            </label>
            <div className="relative">
              <select
                id="summary-length"
                value={length}
                disabled={isGenerating}
                onChange={(e) => onLengthChange(e.target.value as SummaryLength)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {SUMMARY_LENGTHS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="summary-format"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Summary Format
            </label>
            <div className="relative">
              <select
                id="summary-format"
                value={format}
                disabled={isGenerating}
                onChange={(e) => onFormatChange(e.target.value as SummaryFormat)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {SUMMARY_FORMATS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="summary-tone"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Tone
            </label>
            <div className="relative">
              <select
                id="summary-tone"
                value={tone}
                disabled={isGenerating}
                onChange={(e) => onToneChange(e.target.value as SummaryTone)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {SUMMARY_TONES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="summary-language"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Language
            </label>
            <div className="relative">
              <select
                id="summary-language"
                value={language}
                disabled={isGenerating}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E2DDD3] bg-[#FAF9F6]/60 py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#18181B] transition-colors hover:border-[#CBC4B7] focus:border-[#4F46E5] focus:bg-white focus:outline-none disabled:opacity-60"
              >
                {SUMMARY_LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {language === 'Other' && (
          <div>
            <label
              htmlFor="custom-language"
              className="mb-1.5 block text-xs font-medium text-[#3F3F46]"
            >
              Specify target language
            </label>
            <input
              id="custom-language"
              type="text"
              value={customLanguage}
              disabled={isGenerating}
              onChange={(e) => onCustomLanguageChange(e.target.value)}
              placeholder="e.g. Dutch, Bengali, Korean, Turkish"
              className="w-full rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-2.5 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isEmpty || isGenerating || isOverLimit}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#1F2328] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#111315] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D4D4D8] disabled:text-[#71717A] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="whitespace-nowrap">Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#A5B4FC]" aria-hidden="true" />
                <span className="whitespace-nowrap">Generate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isGenerating}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 text-sm font-medium text-[#3F3F46] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <RotateCcw className="h-4 w-4 text-[#71717A]" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
}
