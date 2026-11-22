import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { PronunciationRule } from '../types/vox';

interface PronunciationModalProps {
  isOpen: boolean;
  rules: PronunciationRule[];
  onClose: () => void;
  onAddRule: (word: string, pronunciation: string) => void;
  onDeleteRule: (id: string) => void;
}

export function PronunciationModal({
  isOpen,
  rules,
  onClose,
  onAddRule,
  onDeleteRule,
}: PronunciationModalProps) {
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !pronunciation.trim()) return;
    onAddRule(word.trim(), pronunciation.trim());
    setWord('');
    setPronunciation('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pronunciation-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2
              id="pronunciation-modal-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-white"
            >
              Pronunciation Control
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#A1A1AA]">
              Define how names, acronyms, or technical terms should be spoken. Saved locally.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pronunciation dialog"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#A1A1AA] dark:hover:bg-[#202430] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <div>
            <label htmlFor="pron-word" className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5">
              Original Word
            </label>
            <input
              id="pron-word"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. VoxAI"
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA]/60 focus:border-[#8065F5] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pron-spoken" className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5">
              Spoken As
            </label>
            <input
              id="pron-spoken"
              type="text"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="e.g. Voks A I"
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA]/60 focus:border-[#8065F5] focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!word.trim() || !pronunciation.trim()}
              className="inline-flex h-[38px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-[#8065F5] px-4 text-sm font-medium text-white hover:bg-[#7053eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        <div className="mt-5 max-h-60 overflow-y-auto divide-y divide-slate-200 dark:divide-white/10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318]">
          {rules.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-[#A1A1AA]">
              No custom pronunciations yet. Add names or terms above.
            </p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0 flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {rule.word}
                  </span>
                  <span className="text-slate-400 dark:text-[#A1A1AA]" aria-hidden="true">
                    →
                  </span>
                  <span className="text-[#8065F5] dark:text-[#A78BFA] truncate">
                    {rule.pronunciation}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  aria-label={`Remove ${rule.word}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
