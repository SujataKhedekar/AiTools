import { useState } from 'react';
import { Check, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { AIAssistAction, ResumeDocument } from '../types/resume';
import { runAIAssist } from '../services/api';

interface AIInlineToolbarProps {
  section: string;
  currentText: string;
  resumeContext: ResumeDocument;
  onApply: (newText: string) => void;
  compact?: boolean;
}

const ACTIONS: Array<{ id: AIAssistAction; label: string }> = [
  { id: 'generate', label: 'Generate with AI' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'professional', label: 'Make Professional' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'expand', label: 'Expand' },
  { id: 'improve-wording', label: 'Improve Wording' },
  { id: 'fix-grammar', label: 'Fix Grammar' },
];

export default function AIInlineToolbar({
  section,
  currentText,
  resumeContext,
  onApply,
  compact = false,
}: AIInlineToolbarProps) {
  const [loadingAction, setLoadingAction] = useState<AIAssistAction | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [lastAppliedPrev, setLastAppliedPrev] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: AIAssistAction) => {
    setError(null);
    setLoadingAction(action);
    try {
      const res = await runAIAssist({
        action,
        section,
        text: currentText,
        context: resumeContext,
      });
      if (res.suggestion) {
        setSuggestion(res.suggestion);
      } else {
        setError('No suggestion was returned. Try providing more context.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAccept = () => {
    if (!suggestion) return;
    setLastAppliedPrev(currentText);
    onApply(suggestion);
    setSuggestion(null);
  };

  const handleUndoLocal = () => {
    if (lastAppliedPrev === null) return;
    onApply(lastAppliedPrev);
    setLastAppliedPrev(null);
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D4A843]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Writing Assistant</span>
        </div>
        {lastAppliedPrev !== null && (
          <button
            type="button"
            onClick={handleUndoLocal}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] whitespace-nowrap transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Undo AI Change</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((act) => {
          const isBusy = loadingAction === act.id;
          return (
            <button
              key={act.id}
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleAction(act.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                compact ? 'py-1' : 'py-1.5'
              } ${
                act.id === 'generate'
                  ? 'border-[#D4A843]/40 bg-[#D4A843]/12 text-[#F3D58D] hover:bg-[#D4A843]/20'
                  : 'border-white/[0.08] bg-[#181D29] text-[#D0D7E2] hover:border-white/[0.18] hover:text-white'
              }`}
            >
              {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-red-300 hover:text-white"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {suggestion && (
        <div className="space-y-2.5 rounded-md border border-[#D4A843]/35 bg-[#161B26] p-3">
          <div className="flex items-center justify-between gap-2 text-xs text-[#98A2B3]">
            <span className="font-medium text-[#F3D58D]">Suggested Revision</span>
            <span>Review factual accuracy before accepting</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#ECEFF4]">{suggestion}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#D4A843] px-3 py-1.5 text-xs font-semibold text-[#0B0E14] whitespace-nowrap transition-colors hover:bg-[#E3BB5C]"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Accept Suggestion</span>
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] whitespace-nowrap transition-colors hover:bg-white/[0.06]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
