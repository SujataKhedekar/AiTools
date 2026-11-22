import { useState } from 'react';
import {
  AlertCircle,
  Copy,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CoverLetterDocument, CoverLetterTone, ResumeDocument } from '../types/resume';
import { generateCoverLetterWithAI } from '../services/api';
import { exportCoverLetterToPdf } from '../utils/exportPdf';
import { exportCoverLetterToDocx } from '../utils/exportDocx';

interface CoverLetterViewProps {
  resume: ResumeDocument;
  coverLetter: CoverLetterDocument;
  onChange: (next: CoverLetterDocument) => void;
}

const TONES: Array<{ id: CoverLetterTone; label: string; desc: string }> = [
  { id: 'professional', label: 'Professional', desc: 'Balanced 3–4 paragraphs' },
  { id: 'short', label: 'Short', desc: 'Concise under 200 words' },
  { id: 'creative', label: 'Creative', desc: 'Narrative & distinctive' },
  { id: 'executive', label: 'Executive', desc: 'Strategic leadership tone' },
];

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] px-3 text-sm text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none';

export default function CoverLetterView({
  resume,
  coverLetter,
  onChange,
}: CoverLetterViewProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    if (!coverLetter.companyName.trim() || !coverLetter.jobTitle.trim()) {
      setError('Enter the target company name and target job title first.');
      return;
    }
    setBusy(true);
    try {
      const generated = await generateCoverLetterWithAI({
        resume,
        companyName: coverLetter.companyName,
        jobTitle: coverLetter.jobTitle,
        hiringManager: coverLetter.hiringManager,
        jobDescription: coverLetter.jobDescription,
        tone: coverLetter.tone,
      });
      onChange({
        ...coverLetter,
        subjectLine: generated.subjectLine,
        salutation: generated.salutation,
        paragraphs: generated.paragraphs,
        signOff: generated.signOff,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter.');
    } finally {
      setBusy(false);
    }
  };

  const fullPlainText = [
    coverLetter.subjectLine ? `Subject: ${coverLetter.subjectLine}` : '',
    '',
    coverLetter.salutation,
    '',
    ...coverLetter.paragraphs.flatMap((p) => [p, '']),
    coverLetter.signOff,
    resume.personal.fullName || 'Your Name',
  ].join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasContent = coverLetter.paragraphs.length > 0;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="no-print flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium text-[#D4A843]">Tailored Application Correspondence</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white">
            AI Cover Letter Generator
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#98A2B3]">
            Grounded strictly in your active resume (<strong className="text-white">{resume.title}</strong>). Edit freely, switch tone, and download as PDF or editable Word DOCX.
          </p>
        </div>

        {hasContent && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#181D29] px-3 text-xs font-medium text-white hover:border-white/25"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={() => exportCoverLetterToPdf(coverLetter, resume)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D4A843] px-3.5 text-xs font-semibold text-[#0B0E14] hover:bg-[#E3BB5C]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => exportCoverLetterToDocx(coverLetter, resume)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181D29] px-3.5 text-xs font-medium text-white hover:border-[#D4A843]/50"
            >
              <FileText className="h-3.5 w-3.5 text-[#D4A843]" />
              <span>Download DOCX</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#12161F] px-3 text-xs font-medium text-[#CBD5E1] hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Controls & Editor */}
        <div className="no-print space-y-5 rounded-xl border border-white/[0.08] bg-[#12161F] p-5 lg:col-span-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#98A2B3]">Target Company *</label>
              <input
                type="text"
                value={coverLetter.companyName}
                onChange={(e) => onChange({ ...coverLetter, companyName: e.target.value })}
                placeholder="Stripe"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#98A2B3]">Target Job Title *</label>
              <input
                type="text"
                value={coverLetter.jobTitle}
                onChange={(e) => onChange({ ...coverLetter, jobTitle: e.target.value })}
                placeholder="Staff Frontend Engineer"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#98A2B3]">
              Hiring Manager Name (Optional)
            </label>
            <input
              type="text"
              value={coverLetter.hiringManager}
              onChange={(e) => onChange({ ...coverLetter, hiringManager: e.target.value })}
              placeholder="e.g. Sarah Lin, VP of Engineering"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Preferred Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...coverLetter, tone: t.id })}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    coverLetter.tone === t.id
                      ? 'border-[#D4A843] bg-[#D4A843]/12'
                      : 'border-white/[0.08] bg-[#0B0E14] hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{t.label}</div>
                  <div className="text-[11px] text-[#98A2B3]">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#98A2B3]">
              Job Description (Recommended)
            </label>
            <textarea
              rows={5}
              value={coverLetter.jobDescription}
              onChange={(e) => onChange({ ...coverLetter, jobDescription: e.target.value })}
              placeholder="Paste the role description so the letter highlights your most relevant achievements..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] p-3 text-sm text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={handleGenerate}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4A843] px-5 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#E3BB5C] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasContent ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {busy
                ? 'Drafting Tailored Cover Letter...'
                : hasContent
                  ? 'Regenerate Cover Letter'
                  : 'Generate Cover Letter'}
            </span>
          </button>

          {/* Direct Paragraph Editor */}
          {hasContent && (
            <div className="space-y-3 border-t border-white/[0.08] pt-5">
              <h3 className="text-xs font-semibold text-white">Edit Draft Directly</h3>
              <input
                type="text"
                value={coverLetter.subjectLine}
                onChange={(e) => onChange({ ...coverLetter, subjectLine: e.target.value })}
                placeholder="Subject Line"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                value={coverLetter.salutation}
                onChange={(e) => onChange({ ...coverLetter, salutation: e.target.value })}
                placeholder="Salutation"
                className={INPUT_CLASS}
              />
              {coverLetter.paragraphs.map((para, idx) => (
                <textarea
                  key={idx}
                  rows={4}
                  value={para}
                  onChange={(e) =>
                    onChange({
                      ...coverLetter,
                      paragraphs: coverLetter.paragraphs.map((p, i) =>
                        i === idx ? e.target.value : p,
                      ),
                    })
                  }
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] p-3 text-sm leading-relaxed text-white focus:border-[#D4A843] focus:outline-none"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Live Formatted Letter Preview */}
        <div className="lg:col-span-7">
          {!hasContent ? (
            <div className="flex min-h-[540px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-[#12161F] p-10 text-center">
              <FileText className="h-9 w-9 text-[#D4A843]/80" />
              <h2 className="font-display mt-4 text-lg font-semibold text-white">
                Formatted Letter Preview
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#98A2B3]">
                Enter your target company and job title on the left, select a tone, and generate a tailored cover letter synced with your resume details.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#0D1118] p-6 sm:p-8">
              <article
                id="cover-letter-print-root"
                className="mx-auto max-w-[740px] bg-white p-10 text-[#1F2937] shadow-2xl sm:p-14"
                style={{ fontFamily: `'${resume.design.fontFamily}', system-ui, sans-serif` }}
              >
                <header
                  className="pb-4"
                  style={{ borderBottom: `2px solid ${resume.design.accentColor}` }}
                >
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    {resume.personal.fullName || 'Your Name'}
                  </h2>
                  {resume.personal.jobTitle && (
                    <p
                      className="mt-0.5 text-sm font-medium"
                      style={{ color: resume.design.accentColor }}
                    >
                      {resume.personal.jobTitle}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {[resume.personal.email, resume.personal.phone, resume.personal.location]
                      .filter(Boolean)
                      .join('  •  ')}
                  </p>
                </header>

                <div className="mt-7 space-y-5 text-sm leading-7 text-slate-800">
                  <div className="text-slate-500">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <div>
                    {coverLetter.hiringManager && (
                      <div className="font-medium text-slate-900">{coverLetter.hiringManager}</div>
                    )}
                    {coverLetter.companyName && (
                      <div className="font-semibold text-slate-900">{coverLetter.companyName}</div>
                    )}
                  </div>

                  {coverLetter.subjectLine && (
                    <div
                      className="font-semibold"
                      style={{ color: resume.design.accentColor }}
                    >
                      Re: {coverLetter.subjectLine}
                    </div>
                  )}

                  <p>{coverLetter.salutation}</p>

                  {coverLetter.paragraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}

                  <div className="pt-2">
                    <p>{coverLetter.signOff}</p>
                    <p className="mt-4 font-bold text-slate-900">
                      {resume.personal.fullName || 'Your Name'}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
