import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Send,
} from 'lucide-react';
import type { LiquidValidationResult } from '../types/shopify';

interface LiquidCodeViewProps {
  sectionSlug: string;
  liquidCode: string;
  merchantNotes: string[];
  validation: LiquidValidationResult;
  isRefining: boolean;
  refineError: string | null;
  onRefine: (instruction: string) => Promise<void>;
  onDownload: () => void;
}

function highlightLiquidLine(line: string): React.ReactNode {
  // Tokenize Liquid tags {% ... %}, outputs {{ ... }}, and HTML tags <...> safely via React nodes
  const tokenRegex = /(\{\{-?[\s\S]*?-?\}\}|\{%-?[\s\S]*?-?%\}|<\/?[a-zA-Z0-9-]+(?:\s+[^>]*)?>)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('{%')) {
      parts.push(
        <span key={keyIdx++} className="text-amber-300">
          {token}
        </span>
      );
    } else if (token.startsWith('{{')) {
      parts.push(
        <span key={keyIdx++} className="text-teal-300">
          {token}
        </span>
      );
    } else {
      parts.push(
        <span key={keyIdx++} className="text-sky-300">
          {token}
        </span>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }
  return parts.length > 0 ? parts : ' ';
}

export const LiquidCodeView: React.FC<LiquidCodeViewProps> = ({
  sectionSlug,
  liquidCode,
  merchantNotes,
  validation,
  isRefining,
  refineError,
  onRefine,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [refineInput, setRefineInput] = useState('');

  const lines = useMemo(() => liquidCode.split('\n'), [liquidCode]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(liquidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSubmitRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineInput.trim() || isRefining) return;
    const prompt = refineInput.trim();
    setRefineInput('');
    await onRefine(prompt);
  };

  return (
    <div className="space-y-5">
      {/* Deterministic Liquid Validation Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <h3 className="text-sm font-semibold text-slate-900">
              {validation.isValid
                ? 'Shopify Online Store 2.0 Verification Passed'
                : 'Liquid Section Issues Detected'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
            <span>{validation.errors.length} errors</span>
            <span aria-hidden="true">·</span>
            <span>{validation.warnings.length} warnings</span>
            <span aria-hidden="true">·</span>
            <span>{lines.length} lines</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {validation.checks.map((chk) => (
            <div
              key={chk.id}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5"
            >
              {chk.passed ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : chk.severity === 'warning' ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800">{chk.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  {chk.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#131D33] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-medium text-slate-200">
              sections/{sectionSlug}.liquid
            </span>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {(new Blob([liquidCode]).size / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Liquid
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-500 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Download .liquid
            </button>
          </div>
        </div>

        <div className="max-h-[540px] overflow-auto font-mono text-[12.5px] leading-[1.6]">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="w-12 select-none border-r border-slate-800/80 px-3 py-0.5 text-right text-[11px] text-slate-500 tabular-nums align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre px-4 py-0.5 text-slate-200 align-top">
                    {highlightLiquidLine(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refine Section Prompt Bar */}
      <form
        onSubmit={handleSubmitRefine}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <label
          htmlFor="refine-liquid-input"
          className="block text-xs font-semibold text-slate-800"
        >
          Refine Generated Liquid Section
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Request schema additions, mobile layout adjustments, AJAX quick-add, or CSS tweaks.
        </p>

        {refineError && (
          <div
            role="alert"
            className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {refineError}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="refine-liquid-input"
            type="text"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            placeholder="e.g. Add a mobile-specific image_picker setting and center align text below 750px"
            disabled={isRefining}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={isRefining || !refineInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isRefining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Apply Refinement
              </>
            )}
          </button>
        </div>
      </form>

      {/* Merchant Implementation Notes */}
      {merchantNotes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold text-slate-900">
            Theme Integration Notes
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
            {merchantNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
