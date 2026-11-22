import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Globe,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { AIAssistAction, ResumeDocument, SectionKey } from '../types/resume';
import { runAIAssist } from '../services/api';
import { calculateCompleteness } from '../utils/storage';

interface AIToolsPanelProps {
  resume: ResumeDocument;
  onJumpToSection: (section: SectionKey) => void;
  onApplyHeadline: (headline: string) => void;
  onApplySummary: (summary: string) => void;
  onAddSuggestedSkills: (skills: { technical: string[]; tools: string[]; soft: string[] }) => void;
  onApplyTranslatedResume: (translated: Partial<ResumeDocument>) => void;
}

const LANGUAGES = [
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Japanese',
  'Hindi',
  'Arabic',
  'Mandarin Chinese',
];

const TONES = ['Executive', 'Technical & Precise', 'Concise & Direct', 'Academic & Formal'];

export default function AIToolsPanel({
  resume,
  onJumpToSection,
  onApplyHeadline,
  onApplySummary,
  onAddSuggestedSkills,
  onApplyTranslatedResume,
}: AIToolsPanelProps) {
  const [busyTool, setBusyTool] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputTitle, setOutputTitle] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [outputKind, setOutputKind] = useState<'headline' | 'summary' | 'text'>('text');
  const [copied, setCopied] = useState(false);

  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [targetTone, setTargetTone] = useState('Executive');
  const [skillSuggestions, setSkillSuggestions] = useState<{
    technical: string[];
    tools: string[];
    soft: string[];
    note: string;
  } | null>(null);

  const completeness = calculateCompleteness(resume);

  const invokeTool = async (
    toolKey: string,
    title: string,
    action: AIAssistAction,
    kind: 'headline' | 'summary' | 'text',
    extra?: { targetTone?: string; jobDescription?: string },
  ) => {
    setError(null);
    setBusyTool(toolKey);
    try {
      const res = await runAIAssist({
        action,
        context: resume,
        text: resume.summary,
        targetTone: extra?.targetTone,
        jobDescription: extra?.jobDescription,
      });
      setOutputTitle(title);
      setOutputText(res.suggestion || '');
      setOutputKind(kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI assistant error.');
    } finally {
      setBusyTool(null);
    }
  };

  const handleSuggestSkills = async () => {
    setError(null);
    setBusyTool('skills');
    try {
      const res = await runAIAssist({
        action: 'suggest-skills',
        context: resume,
        jobDescription: targetJobDesc,
      });
      if (res.result) {
        setSkillSuggestions(res.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not recommend skills.');
    } finally {
      setBusyTool(null);
    }
  };

  const handleTranslate = async () => {
    setError(null);
    setBusyTool('translate');
    try {
      const res = await runAIAssist({
        action: 'translate',
        context: resume,
        targetLanguage: targetLang,
      });
      if (res.translatedResume) {
        onApplyTranslatedResume(res.translatedResume);
        setOutputTitle(`Translated to ${targetLang}`);
        setOutputText(`Your resume sections have been translated into ${targetLang}. You can press Undo anytime to revert.`);
        setOutputKind('text');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed.');
    } finally {
      setBusyTool(null);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Completeness Checker */}
      <div className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white">Resume Completeness</h3>
          <span className="font-mono-tabular text-sm font-bold text-[#D4A843]">
            {completeness.score}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full bg-[#D4A843] transition-all duration-300"
            style={{ width: `${completeness.score}%` }}
          />
        </div>
        <div className="space-y-1.5 pt-1">
          {completeness.checks.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onJumpToSection(c.sectionId as SectionKey)}
              className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-white/[0.04]"
            >
              {c.completed ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748B]" />
              )}
              <span className={c.completed ? 'text-[#98A2B3]' : 'text-[#ECEFF4]'}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick AI Generators */}
      <div className="space-y-2.5 border-t border-white/[0.08] pt-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-[#D4A843]" />
          <span>Career Content Generators</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() =>
              invokeTool('headline', 'Resume Headline Options', 'headline', 'headline')
            }
            className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#181D29] px-3 py-2 text-left text-xs font-medium text-[#ECEFF4] transition-colors hover:border-[#D4A843]/40 disabled:opacity-50"
          >
            <span>Resume Headline Generator</span>
            {busyTool === 'headline' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4A843]" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-[#D4A843]" />
            )}
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() =>
              invokeTool('linkedin', 'LinkedIn About Summary', 'linkedin-summary', 'text')
            }
            className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#181D29] px-3 py-2 text-left text-xs font-medium text-[#ECEFF4] transition-colors hover:border-[#D4A843]/40 disabled:opacity-50"
          >
            <span>LinkedIn Summary Generator</span>
            {busyTool === 'linkedin' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4A843]" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-[#D4A843]" />
            )}
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() =>
              invokeTool('objective', 'Career Objective', 'career-objective', 'summary')
            }
            className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#181D29] px-3 py-2 text-left text-xs font-medium text-[#ECEFF4] transition-colors hover:border-[#D4A843]/40 disabled:opacity-50"
          >
            <span>Career Objective Generator</span>
            {busyTool === 'objective' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4A843]" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-[#D4A843]" />
            )}
          </button>
        </div>
      </div>

      {/* Job-Specific Tailoring & Skills Recommendation */}
      <div className="space-y-2.5 border-t border-white/[0.08] pt-5">
        <h3 className="text-xs font-semibold text-white">Job-Specific Tailoring & Skills</h3>
        <textarea
          rows={3}
          value={targetJobDesc}
          onChange={(e) => setTargetJobDesc(e.target.value)}
          placeholder="Paste a target job description (optional) to get tailoring advice or skill suggestions..."
          className="w-full rounded-md border border-white/[0.1] bg-[#0B0E14] p-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busyTool !== null || targetJobDesc.trim().length < 20}
            onClick={() =>
              invokeTool('tailor', 'Job Tailoring Plan', 'tailor-job', 'text', {
                jobDescription: targetJobDesc,
              })
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-white/[0.1] bg-[#181D29] px-2.5 text-xs font-medium text-white transition-colors hover:border-[#D4A843]/50 disabled:opacity-45"
          >
            {busyTool === 'tailor' && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Tailor Advice</span>
          </button>
          <button
            type="button"
            disabled={busyTool !== null}
            onClick={handleSuggestSkills}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D4A843]/40 bg-[#D4A843]/12 px-2.5 text-xs font-medium text-[#F3D58D] transition-colors hover:bg-[#D4A843]/20 disabled:opacity-45"
          >
            {busyTool === 'skills' && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Suggest Skills</span>
          </button>
        </div>

        {skillSuggestions && (
          <div className="space-y-2 rounded-md border border-[#D4A843]/30 bg-[#161B26] p-3 text-xs">
            <div className="font-semibold text-[#F3D58D]">Recommended Skills (Verify before adding)</div>
            {skillSuggestions.technical.length > 0 && (
              <div>
                <span className="font-medium text-white">Technical: </span>
                <span className="text-[#CBD5E1]">{skillSuggestions.technical.join(', ')}</span>
              </div>
            )}
            {skillSuggestions.tools.length > 0 && (
              <div>
                <span className="font-medium text-white">Tools: </span>
                <span className="text-[#CBD5E1]">{skillSuggestions.tools.join(', ')}</span>
              </div>
            )}
            {skillSuggestions.soft.length > 0 && (
              <div>
                <span className="font-medium text-white">Soft: </span>
                <span className="text-[#CBD5E1]">{skillSuggestions.soft.join(', ')}</span>
              </div>
            )}
            <p className="text-[11px] text-[#98A2B3]">{skillSuggestions.note}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onAddSuggestedSkills(skillSuggestions);
                  setSkillSuggestions(null);
                }}
                className="rounded-md bg-[#D4A843] px-2.5 py-1 text-xs font-semibold text-[#0B0E14] hover:bg-[#E3BB5C]"
              >
                Merge Into Skills
              </button>
              <button
                type="button"
                onClick={() => setSkillSuggestions(null)}
                className="rounded-md border border-white/[0.1] px-2.5 py-1 text-xs text-[#98A2B3] hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tone Adjustment & Translation */}
      <div className="space-y-3 border-t border-white/[0.08] pt-5">
        <h3 className="text-xs font-semibold text-white">Tone & Translation</h3>

        <div className="flex gap-2">
          <select
            value={targetTone}
            onChange={(e) => setTargetTone(e.target.value)}
            className="h-9 flex-1 rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() =>
              invokeTool('tone', `${targetTone} Summary Rewrite`, 'tone-adjust', 'summary', {
                targetTone,
              })
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#181D29] px-3 text-xs font-medium text-white whitespace-nowrap hover:border-[#D4A843]/50 disabled:opacity-50"
          >
            {busyTool === 'tone' && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Adjust Tone</span>
          </button>
        </div>

        <div className="flex gap-2">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="h-9 flex-1 rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busyTool !== null}
            onClick={handleTranslate}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#181D29] px-3 text-xs font-medium text-white whitespace-nowrap hover:border-[#D4A843]/50 disabled:opacity-50"
          >
            {busyTool === 'translate' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-[#D4A843]" />
            )}
            <span>Translate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {outputText && (
        <div className="space-y-2.5 rounded-lg border border-[#D4A843]/35 bg-[#161B26] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#F3D58D]">{outputTitle}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          {outputKind === 'headline' ? (
            <div className="space-y-1.5">
              {outputText
                .split('\n')
                .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
                .filter(Boolean)
                .map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/[0.06] bg-[#10141D] px-2.5 py-2 text-xs text-[#ECEFF4]"
                  >
                    <span>{line}</span>
                    <button
                      type="button"
                      onClick={() => onApplyHeadline(line)}
                      className="shrink-0 font-medium text-[#D4A843] hover:underline"
                    >
                      Use
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#ECEFF4]">
                {outputText}
              </p>
              {outputKind === 'summary' && (
                <button
                  type="button"
                  onClick={() => onApplySummary(outputText)}
                  className="rounded-md bg-[#D4A843] px-3 py-1.5 text-xs font-semibold text-[#0B0E14] hover:bg-[#E3BB5C]"
                >
                  Apply to Professional Summary
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
