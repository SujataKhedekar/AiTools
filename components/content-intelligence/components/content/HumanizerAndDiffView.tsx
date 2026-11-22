import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  Copy,
  Loader2,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { WRITING_STYLES } from '../../config/contentConfig';
import {
  buildParagraphDiffBlocks,
  computeWordDiff,
} from '../../lib/text/diffUtils';
import { computeLiveTextCounters } from '../../lib/text/liveCounters';
import type {
  ContextualRewriteProfile,
  DocumentSection,
  RewriteResponse,
  RewriteScope,
  WritingStyle,
} from '../../types/contentIntelligence';

interface HumanizerAndDiffViewProps {
  originalText: string;
  improvedText: string;
  onUpdateImprovedText: (nextText: string, recordHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRestoreOriginal: () => void;
  onRunRewrite: (options: {
    scope: RewriteScope;
    style: WritingStyle;
    targetText: string;
    preserveKeywords: boolean;
    preserveEntities: boolean;
    customInstruction?: string;
    paragraphIndex?: number;
  }) => Promise<RewriteResponse>;
  profile: ContextualRewriteProfile;
  sections: DocumentSection[];
  lastRewriteMeta: RewriteResponse | null;
}

export const HumanizerAndDiffView: React.FC<HumanizerAndDiffViewProps> = ({
  originalText,
  improvedText,
  onUpdateImprovedText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRestoreOriginal,
  onRunRewrite,
  profile,
  lastRewriteMeta,
}) => {
  const [scope, setScope] = useState<RewriteScope>('article');
  const [style, setStyle] = useState<WritingStyle>('Human editorial');
  const [preserveKeywords, setPreserveKeywords] = useState(true);
  const [preserveEntities, setPreserveEntities] = useState(true);
  const [selectedParagraphIdx, setSelectedParagraphIdx] = useState(0);
  const [selectedCustomSnippet, setSelectedCustomSnippet] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'word_diff' | 'paragraph_decisions' | 'edit_right'>('word_diff');
  const [copied, setCopied] = useState(false);
  const [rejectedBlockIds, setRejectedBlockIds] = useState<Set<string>>(new Set());
  const [acceptedBlockIds, setAcceptedBlockIds] = useState<Set<string>>(new Set());

  const paragraphs = useMemo(
    () =>
      originalText
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [originalText]
  );

  const wordChanges = useMemo(
    () => computeWordDiff(originalText, improvedText),
    [originalText, improvedText]
  );

  const paragraphBlocks = useMemo(
    () => buildParagraphDiffBlocks(originalText, improvedText),
    [originalText, improvedText]
  );

  const origCounters = computeLiveTextCounters(originalText);
  const impCounters = computeLiveTextCounters(improvedText);

  // Live keyword occurrence comparison between Original and Improved
  const keywordComparison = useMemo(() => {
    const kws = [
      ...(profile.primaryKeyword.trim()
        ? [{ keyword: profile.primaryKeyword.trim(), isPrimary: true }]
        : []),
      ...profile.secondaryKeywords
        .map((k) => k.trim())
        .filter(Boolean)
        .map((keyword) => ({ keyword, isPrimary: false })),
    ];

    return kws.map(({ keyword, isPrimary }) => {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'gi'
      );
      const origMatches = (originalText.match(regex) ?? []).length;
      const impMatches = (improvedText.match(regex) ?? []).length;
      return { keyword, isPrimary, origMatches, impMatches };
    });
  }, [originalText, improvedText, profile.primaryKeyword, profile.secondaryKeywords]);

  const handleGenerateRewrite = async () => {
    setRewriteError(null);
    let targetText = originalText;

    if (scope === 'paragraph') {
      targetText = paragraphs[selectedParagraphIdx] ?? originalText;
    } else if (scope === 'sentence') {
      const firstSentence =
        selectedCustomSnippet.trim() ||
        originalText.split(/(?<=[.!?])\s+/)[0] ||
        originalText;
      targetText = firstSentence;
    } else if (scope === 'selection') {
      if (!selectedCustomSnippet.trim()) {
        setRewriteError('Paste or enter the selected text excerpt you want rewritten.');
        return;
      }
      targetText = selectedCustomSnippet.trim();
    }

    setIsRewriting(true);
    try {
      const res = await onRunRewrite({
        scope,
        style,
        targetText,
        preserveKeywords,
        preserveEntities,
        customInstruction: customInstruction.trim() || undefined,
        paragraphIndex: scope === 'paragraph' ? selectedParagraphIdx : undefined,
      });

      if (scope === 'article') {
        onUpdateImprovedText(res.rewrittenText, true);
      } else if (scope === 'paragraph') {
        const nextParas = [...paragraphs];
        if (nextParas[selectedParagraphIdx] !== undefined) {
          nextParas[selectedParagraphIdx] = res.rewrittenText.trim();
          onUpdateImprovedText(nextParas.join('\n\n'), true);
        }
      } else {
        const base = improvedText || originalText;
        if (base.includes(targetText)) {
          onUpdateImprovedText(base.replace(targetText, res.rewrittenText.trim()), true);
        } else {
          onUpdateImprovedText(res.rewrittenText.trim(), true);
        }
      }

      setAcceptedBlockIds(new Set());
      setRejectedBlockIds(new Set());
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Rewrite failed.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAcceptParagraphBlock = (idx: number) => {
    const block = paragraphBlocks[idx];
    if (!block) return;
    setAcceptedBlockIds((prev) => new Set(prev).add(block.id));
    setRejectedBlockIds((prev) => {
      const next = new Set(prev);
      next.delete(block.id);
      return next;
    });
  };

  const handleRejectParagraphBlock = (idx: number) => {
    const block = paragraphBlocks[idx];
    if (!block) return;
    const impParas = improvedText
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (block.originalParagraph) {
      impParas[idx] = block.originalParagraph;
      onUpdateImprovedText(impParas.join('\n\n'), true);
    }
    setRejectedBlockIds((prev) => new Set(prev).add(block.id));
  };

  const handleAcceptAll = () => {
    const allIds = new Set(paragraphBlocks.map((b) => b.id));
    setAcceptedBlockIds(allIds);
    setRejectedBlockIds(new Set());
  };

  const handleCopyFinal = async () => {
    try {
      await navigator.clipboard.writeText(improvedText || originalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div className="space-y-5">
      {/* Rewriter Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              AI Humanizer &amp; Contextual Content Rewriter
            </h3>
            <p className="text-xs text-slate-500">
              Preserves facts, entities, and SEO keywords while eliminating clichés and robotic rhythm.
            </p>
          </div>

          <button
            type="button"
            disabled={isRewriting || !originalText.trim()}
            onClick={handleGenerateRewrite}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isRewriting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isRewriting ? 'Rewriting...' : 'Generate Rewritten Content'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Rewrite Scope
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  ['article', 'Complete Article'],
                  ['paragraph', 'One Paragraph'],
                  ['sentence', 'One Sentence'],
                  ['selection', 'Selected Text'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScope(val)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                    scope === val
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Writing Style (11 Modes)
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as WritingStyle)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            >
              {WRITING_STYLES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.value}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              {WRITING_STYLES.find((s) => s.value === style)?.description}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Preservation Guardrails
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveKeywords}
                onChange={(e) => setPreserveKeywords(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              Preserve primary &amp; secondary SEO keywords naturally
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveEntities}
                onChange={(e) => setPreserveEntities(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              Preserve facts, numbers, URLs, and named entities
            </label>
          </div>
        </div>

        {/* Scope-specific target input */}
        {scope === 'paragraph' && paragraphs.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Paragraph to Rewrite
            </label>
            <select
              value={selectedParagraphIdx}
              onChange={(e) => setSelectedParagraphIdx(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900"
            >
              {paragraphs.map((p, idx) => (
                <option key={idx} value={idx}>
                  Paragraph {idx + 1}: {p.slice(0, 95)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {(scope === 'sentence' || scope === 'selection') && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {scope === 'sentence'
                ? 'Sentence Excerpt to Rewrite (leave blank to rewrite first sentence)'
                : 'Paste Selected Excerpt from Original Text'}
            </label>
            <textarea
              rows={2}
              value={selectedCustomSnippet}
              onChange={(e) => setSelectedCustomSnippet(e.target.value)}
              placeholder="Paste the exact sentence or passage to rewrite..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Optional Editorial Instruction
          </label>
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="e.g., Shorten opening by 30%, use active verbs, keep bullet specs intact"
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900"
          />
        </div>

        {rewriteError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {rewriteError}
          </div>
        )}
      </div>

      {/* Keyword Preservation & Rationale Banner */}
      {(keywordComparison.length > 0 || lastRewriteMeta) && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          {keywordComparison.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">
                SEO Keyword Appearance Comparison (Original vs. Rewritten)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 pr-4 font-medium">Keyword</th>
                      <th className="py-1.5 px-3 font-medium">Role</th>
                      <th className="py-1.5 px-3 font-medium text-right">Original</th>
                      <th className="py-1.5 pl-3 font-medium text-right">Improved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {keywordComparison.map((kw) => (
                      <tr key={kw.keyword}>
                        <td className="py-1.5 pr-4 font-medium text-slate-900">{kw.keyword}</td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {kw.isPrimary ? 'Primary' : 'Secondary'}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {kw.origMatches}x
                        </td>
                        <td
                          className={`py-1.5 pl-3 text-right font-mono tabular-nums font-semibold ${
                            kw.impMatches > 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {kw.impMatches}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {lastRewriteMeta && lastRewriteMeta.changeRationale.length > 0 && (
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Editorial edits applied: </span>
              {lastRewriteMeta.changeRationale.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Original vs Rewritten Comparison Editor */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('word_diff')}
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                viewMode === 'word_diff'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Word-Level Diff
            </button>
            <button
              type="button"
              onClick={() => setViewMode('paragraph_decisions')}
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                viewMode === 'paragraph_decisions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Accept / Reject Changes
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit_right')}
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                viewMode === 'edit_right'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Edit Improved
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <Redo2 className="w-3.5 h-3.5" />
              Redo
            </button>
            <button
              type="button"
              onClick={onRestoreOriginal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Original
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Accept All
            </button>
            <button
              type="button"
              onClick={handleCopyFinal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Final Content'}
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        {viewMode === 'paragraph_decisions' ? (
          <div className="divide-y divide-slate-200">
            {paragraphBlocks.map((block, idx) => {
              const isAccepted = acceptedBlockIds.has(block.id);
              const isRejected = rejectedBlockIds.has(block.id);

              return (
                <div key={block.id} className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                  <div className="p-5 bg-slate-50/40">
                    <div className="text-[11px] font-mono text-slate-500 mb-2">
                      Original · Block {idx + 1}
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700">
                      {block.wordChanges.map((part, pIdx) => {
                        if (part.added) return null;
                        if (part.removed) {
                          return (
                            <span
                              key={pIdx}
                              className="bg-red-100 text-red-900 line-through decoration-red-400 px-0.5 rounded-xs"
                            >
                              {part.value}
                            </span>
                          );
                        }
                        return <span key={pIdx}>{part.value}</span>;
                      })}
                    </div>
                  </div>

                  <div className="p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        Improved · Block {idx + 1}
                      </span>
                      {block.hasChanges && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAcceptParagraphBlock(idx)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border ${
                              isAccepted
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            {isAccepted ? 'Accepted' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectParagraphBlock(idx)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border ${
                              isRejected
                                ? 'bg-slate-200 text-slate-800 border-slate-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            Revert
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-sm leading-relaxed text-slate-900">
                      {block.wordChanges.map((part, pIdx) => {
                        if (part.removed) return null;
                        if (part.added) {
                          return (
                            <span
                              key={pIdx}
                              className="bg-emerald-100 text-emerald-950 font-medium px-0.5 rounded-xs"
                            >
                              {part.value}
                            </span>
                          );
                        }
                        return <span key={pIdx}>{part.value}</span>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* LEFT PANEL: Original Content */}
            <div className="p-5 bg-slate-50/40">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs">
                <span className="font-semibold text-slate-900">Original Content</span>
                <span className="font-mono tabular-nums text-slate-500">
                  {origCounters.wordCount} words · {origCounters.estimatedReadingTimeLabel}
                </span>
              </div>

              {viewMode === 'word_diff' ? (
                <div className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {wordChanges.map((part, i) => {
                    if (part.added) return null;
                    if (part.removed) {
                      return (
                        <span
                          key={i}
                          className="bg-red-100 text-red-900 line-through decoration-red-400 px-0.5 rounded-xs"
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={i}>{part.value}</span>;
                  })}
                </div>
              ) : (
                <div className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {originalText}
                </div>
              )}
            </div>

            {/* RIGHT PANEL: Improved Content */}
            <div className="p-5 bg-white">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs">
                <span className="font-semibold text-slate-900">Improved Content</span>
                <span className="font-mono tabular-nums text-slate-500">
                  {impCounters.wordCount} words · {impCounters.estimatedReadingTimeLabel}
                </span>
              </div>

              {viewMode === 'word_diff' ? (
                <div className="text-[15px] leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {wordChanges.map((part, i) => {
                    if (part.removed) return null;
                    if (part.added) {
                      return (
                        <span
                          key={i}
                          className="bg-emerald-100 text-emerald-950 font-medium px-0.5 rounded-xs"
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={i}>{part.value}</span>;
                  })}
                </div>
              ) : (
                <textarea
                  value={improvedText}
                  onChange={(e) => onUpdateImprovedText(e.target.value, true)}
                  rows={18}
                  className="w-full rounded-lg border border-slate-200 p-3 text-[15px] leading-relaxed text-slate-900 focus:outline-none focus:border-slate-400"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
