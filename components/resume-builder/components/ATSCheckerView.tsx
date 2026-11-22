import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Info,
  Loader2,
  Plus,
  ScanSearch,
  XCircle,
} from 'lucide-react';
import { ATSAnalysisResult, ResumeDocument } from '../types/resume';
import { analyzeATSWithAI, extractTextFromFile } from '../services/api';

interface ATSCheckerViewProps {
  resume: ResumeDocument;
  onAddVerifiedSkill: (skill: string) => void;
  onOpenEditor: () => void;
}

export default function ATSCheckerView({
  resume,
  onAddVerifiedSkill,
  onOpenEditor,
}: ATSCheckerViewProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ATSAnalysisResult | null>(null);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());

  const handleUploadJd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setJobDescription(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read job description file.');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    if (jobDescription.trim().length < 25) {
      setError('Paste or upload a target job description (at least 25 characters) to analyze ATS compatibility.');
      return;
    }
    setAnalyzing(true);
    try {
      const analysis = await analyzeATSWithAI(resume, jobDescription);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ATS analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 78) return '#16A34A';
    if (score >= 55) return '#D97706';
    return '#DC2626';
  };

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = result
    ? circumference - (Math.min(100, Math.max(0, result.overallScore)) / 100) * circumference
    : circumference;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium text-[#D4A843]">ATS Optimization Engine</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white">
            ATS Resume Checker
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#98A2B3]">
            Evaluate <strong className="text-white">{resume.title}</strong> against a target job description to uncover keyword gaps, formatting pitfalls, and readability improvements.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditor}
          className="inline-flex h-10 shrink-0 items-center rounded-lg border border-white/[0.12] bg-[#181D29] px-4 text-xs font-semibold text-white whitespace-nowrap hover:border-[#D4A843]/50"
        >
          Back to Live Editor
        </button>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#12161F] p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-white">
              Target Job Description
            </h2>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.12] bg-[#181D29] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:text-white">
              {extracting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4A843]" />
              ) : (
                <FileUp className="h-3.5 w-3.5 text-[#D4A843]" />
              )}
              <span>{extracting ? 'Reading...' : 'Upload PDF / DOCX / TXT'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleUploadJd}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={13}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting (responsibilities, required skills, qualifications)..."
            className="w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] p-3.5 text-sm leading-relaxed text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none"
          />

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={analyzing}
            onClick={handleAnalyze}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4A843] px-5 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#E3BB5C] disabled:opacity-60"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4" />
            )}
            <span>{analyzing ? 'Analyzing Resume Against Job...' : 'Run ATS Compatibility Check'}</span>
          </button>

          <div className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-[#0F131B] p-3 text-xs text-[#98A2B3]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A843]" />
            <span>
              ATS platforms (Workday, Greenhouse, Lever, Taleo, iCIMS) parse resumes differently. This score is an advisory diagnostic and does not guarantee automated screening outcomes.
            </span>
          </div>
        </div>

        {/* Results Dashboard */}
        <div className="space-y-6 lg:col-span-7">
          {!result ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-[#12161F] p-10 text-center">
              <ScanSearch className="h-9 w-9 text-[#D4A843]/80" />
              <h2 className="font-display mt-4 text-lg font-semibold text-white">
                Ready for ATS Evaluation
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#98A2B3]">
                Paste or upload a job description on the left to inspect your keyword match rate, 6-category compatibility breakdown, contact & formatting checks, and concrete improvement steps.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Score Overview */}
              <div className="grid grid-cols-1 gap-6 rounded-xl border border-white/[0.08] bg-[#12161F] p-6 sm:grid-cols-12">
                <div className="flex flex-col items-center justify-center sm:col-span-4">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    <svg className="h-36 w-36 -rotate-90" viewBox="0 0 132 132">
                      <circle
                        cx="66"
                        cy="66"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="66"
                        cy="66"
                        r={radius}
                        fill="none"
                        stroke={scoreColor(result.overallScore)}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={scoreOffset}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono-tabular text-3xl font-bold text-white">
                        {result.overallScore}
                      </span>
                      <span className="text-[11px] text-[#98A2B3]">out of 100</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-white">
                    ATS Compatibility: {result.overallScore}/100
                  </div>
                </div>

                {/* 6 Category Bars */}
                <div className="space-y-3 sm:col-span-8">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-semibold text-white">Category Breakdown</span>
                    <span className="font-mono-tabular text-xs text-[#D4A843]">
                      Keyword Match: {result.keywordMatchPercent}%
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {result.categories.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#ECEFF4]">{cat.name}</span>
                          <span className="font-mono-tabular text-[#CBD5E1]">{cat.score}/100</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, cat.score))}%`,
                              backgroundColor: scoreColor(cat.score),
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-[#7E8A9E]">{cat.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keywords Panel */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#12161F] p-5">
                  <h3 className="text-xs font-semibold text-emerald-400">
                    Matched Keywords ({result.matchedKeywords.length})
                  </h3>
                  <p className="text-xs leading-relaxed text-[#CBD5E1]">
                    {result.matchedKeywords.length > 0
                      ? result.matchedKeywords.join(' · ')
                      : 'No exact keyword overlaps detected yet.'}
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#12161F] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-amber-400">
                      Missing Keywords ({result.missingKeywords.length})
                    </h3>
                    <span className="text-[11px] text-[#64748B]">Add only if you have experience</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw) => {
                      const alreadyAdded = addedSkills.has(kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => {
                            onAddVerifiedSkill(kw);
                            setAddedSkills((prev) => new Set(prev).add(kw));
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181D29] px-2.5 py-1 text-xs text-[#ECEFF4] transition-colors hover:border-[#D4A843]/50 disabled:border-emerald-500/40 disabled:text-emerald-300"
                        >
                          {alreadyAdded ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Plus className="h-3 w-3 text-[#D4A843]" />
                          )}
                          <span>{kw}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Contact, Formatting & Experience Relevance */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#12161F] p-5">
                  <h3 className="text-xs font-semibold text-white">Contact & Section Checks</h3>
                  <div className="space-y-2">
                    {result.contactChecks.map((chk, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        {chk.passed ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        )}
                        <div>
                          <span className="font-medium text-white">{chk.label}: </span>
                          <span className="text-[#98A2B3]">{chk.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#12161F] p-5">
                  <h3 className="text-xs font-semibold text-white">Formatting & Readability</h3>
                  {result.formattingIssues.length === 0 ? (
                    <p className="text-xs text-emerald-400">No major ATS formatting conflicts detected.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-[#CBD5E1]">
                      {result.formattingIssues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-white/[0.06] pt-2.5 text-xs text-[#98A2B3]">
                    <strong className="text-white">Experience Relevance: </strong>
                    {result.experienceRelevance}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#12161F] p-5">
                <h3 className="text-xs font-semibold text-white">Prioritized Recommendations</h3>
                <div className="divide-y divide-white/[0.06]">
                  {result.actionableRecommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-0">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-white">
                          {rec.area}
                          <span aria-hidden="true"> · </span>
                          <span
                            className={
                              rec.priority === 'high'
                                ? 'text-red-400'
                                : rec.priority === 'medium'
                                  ? 'text-amber-400'
                                  : 'text-[#98A2B3]'
                            }
                          >
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="leading-relaxed text-[#CBD5E1]">{rec.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicit Disclaimer */}
              <p className="text-xs leading-relaxed text-[#7E8A9E]">
                {result.disclaimer ||
                  'Note: Applicant Tracking Systems vary significantly across employers. A high score improves structural and keyword clarity but does not guarantee interview selection.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
