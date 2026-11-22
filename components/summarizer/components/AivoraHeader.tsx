import { ChevronRight, Sparkles } from 'lucide-react';

interface AivoraHeaderProps {
  onResetAll: () => void;
  onScrollToInputs: () => void;
  onScrollToOutput: () => void;
  hasResult: boolean;
}

export function AivoraHeader({
  onResetAll,
  onScrollToInputs,
  onScrollToOutput,
  hasResult,
}: AivoraHeaderProps) {
  return (
    <div className="no-print">
      {/* Top Bar following clean 3-zone contract */}
      <header className="border-b border-[#E8E4DC] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onScrollToInputs();
            }}
            className="font-display text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
          >
            Aivora
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#52525B]"
          >
            <a
              href="#inputs-panel"
              onClick={(e) => {
                e.preventDefault();
                onScrollToInputs();
              }}
              className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
            >
              AI Service
            </a>
            <a
              href="#inputs-panel"
              onClick={(e) => {
                e.preventDefault();
                onScrollToInputs();
              }}
              className="text-[#18181B] underline decoration-[#6366F1]/50 underline-offset-4 whitespace-nowrap shrink-0"
            >
              AI Summarizer
            </a>
            <a
              href="#output-panel"
              onClick={(e) => {
                e.preventDefault();
                onScrollToOutput();
              }}
              className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
            >
              Output
            </a>
            {hasResult && (
              <a
                href="#output-panel"
                onClick={(e) => {
                  e.preventDefault();
                  onScrollToOutput();
                }}
                className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
              >
                Export
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetAll}
              className="rounded-lg border border-[#E2DDD3] bg-white px-4 py-2 text-xs font-medium text-[#18181B] shadow-2xs hover:bg-[#FAF9F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              New Summary
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb & Tool Header */}
      <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-5 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[#71717A]"
        >
          <button
            type="button"
            onClick={onScrollToInputs}
            className="hover:text-[#18181B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA]" aria-hidden="true" />
          <button
            type="button"
            onClick={onScrollToInputs}
            className="hover:text-[#18181B] transition-colors cursor-pointer"
          >
            AI Service
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA]" aria-hidden="true" />
          <span className="text-[#18181B]">AI Summarizer</span>
        </nav>

        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#EEF2FF] text-[#4F46E5] shadow-2xs"
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#18181B] sm:text-[26px]">
                AI Summarizer
              </h1>
              <span className="inline-flex items-center rounded-md border border-[#C7D2FE] bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#4338CA]">
                NEW
              </span>
            </div>
            <p className="mt-1 text-sm text-[#52525B] sm:text-[15px]">
              Condense long text into clear key points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
