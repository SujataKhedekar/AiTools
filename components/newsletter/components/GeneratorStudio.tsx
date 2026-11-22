import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  PenLine,
  RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import { THEME_PRESETS } from '../data/presets';
import {
  generateNewsletterFromBrief,
  generateSubjectVariations,
} from '../services/newsletterApi';
import {
  GeneratorBrief,
  GeneratorFormat,
  GeneratorLength,
  GeneratorTone,
  NewsletterBlock,
  NewsletterIssue,
  SubjectOption,
  ThemePresetId,
} from '../types/newsletter';
import { computeIssueStats, sanitizeUrl } from '../utils/newsletterExport';
import { ResilientImage } from './ResilientImage';
import { RichInlineText } from './RichInlineText';

interface GeneratorStudioProps {
  activeIssue: NewsletterIssue;
  subjectOptions: SubjectOption[];
  nextIssueNumber: string;
  onGeneratedIssue: (issue: NewsletterIssue, options: SubjectOption[]) => void;
  onUpdateSubjectOptions: (options: SubjectOption[]) => void;
  onApplySubjectOption: (option: SubjectOption) => void;
  onOpenEditor: () => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
}

const SAMPLE_BRIEFS: Array<{
  label: string;
  brief: Partial<GeneratorBrief>;
}> = [
  {
    label: 'Weekly Design & Tech Digest',
    brief: {
      topic:
        'A weekly curated digest covering calm software design, local-first web apps, and practical typography habits for product teams.',
      audience: 'Product designers, front-end engineers, and indie founders',
      format: 'digest',
      tone: 'concise',
      length: 'medium',
      themeId: 'forest-monograph',
      includeCoverImage: true,
      includeLinks: true,
      includeQuote: false,
      includeMetrics: false,
      includeCallout: true,
      includeCta: true,
    },
  },
  {
    label: 'Monthly Product Release',
    brief: {
      topic:
        'November product update announcing 2x faster PDF exports, new keyboard shortcuts, custom brand themes, and our Q1 roadmap priorities.',
      audience: 'Active SaaS customers and team workspace admins',
      format: 'product',
      tone: 'analytical',
      length: 'short',
      themeId: 'broadsheet-crimson',
      includeCoverImage: true,
      includeLinks: false,
      includeQuote: false,
      includeMetrics: true,
      includeCallout: true,
      includeCta: true,
    },
  },
  {
    label: 'Long-Form Editorial Essay',
    brief: {
      topic:
        'Why small, focused creative studios consistently ship more memorable work than sprawling teams—and how constraints sharpen taste.',
      audience: 'Creative directors, independent writers, and studio founders',
      format: 'essay',
      tone: 'editorial',
      length: 'medium',
      themeId: 'gallery-stark',
      includeCoverImage: true,
      includeLinks: true,
      includeQuote: true,
      includeMetrics: false,
      includeCallout: true,
      includeCta: false,
    },
  },
  {
    label: 'Founder Member Letter',
    brief: {
      topic:
        'An honest year-end letter to paying members reflecting on what worked this year, two experiments we shut down, and how we plan to stay independent.',
      audience: 'Supporting members and longtime community readers',
      format: 'letter',
      tone: 'warm',
      length: 'medium',
      themeId: 'archival-paper',
      includeCoverImage: false,
      includeLinks: false,
      includeQuote: true,
      includeMetrics: false,
      includeCallout: false,
      includeCta: false,
    },
  },
];

const INITIAL_BRIEF: GeneratorBrief = {
  topic: '',
  sourceNotes: '',
  publicationName: '',
  authorName: '',
  audience: 'Product builders, designers, and independent thinkers',
  format: 'essay',
  tone: 'editorial',
  length: 'medium',
  themeId: 'gallery-stark',
  includeCoverImage: true,
  includeQuote: true,
  includeLinks: true,
  includeMetrics: false,
  includeCallout: true,
  includeCta: true,
};

export function GeneratorStudio({
  activeIssue,
  subjectOptions,
  nextIssueNumber,
  onGeneratedIssue,
  onUpdateSubjectOptions,
  onApplySubjectOption,
  onOpenEditor,
  onOpenPreview,
  onOpenExport,
}: GeneratorStudioProps) {
  const [brief, setBrief] = useState<GeneratorBrief>(INITIAL_BRIEF);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingSubjects, setIsRefreshingSubjects] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false);

  const stats = computeIssueStats(activeIssue);

  const handleSelectFormat = (format: GeneratorFormat) => {
    setBrief((prev) => ({
      ...prev,
      format,
      includeLinks: format === 'digest' ? true : prev.includeLinks,
      includeMetrics: format === 'product' ? true : prev.includeMetrics,
      includeQuote: format === 'essay' || format === 'letter' ? true : prev.includeQuote,
    }));
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (brief.topic.trim().length < 3) {
      setErrorMessage('Enter a newsletter topic or choose one of the sample briefs above.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const result = await generateNewsletterFromBrief(brief, nextIssueNumber);
      onGeneratedIssue(result.issue, result.subjectOptions);
      setHasGeneratedInSession(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to generate newsletter right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMoreSubjects = async () => {
    setErrorMessage(null);
    setIsRefreshingSubjects(true);
    try {
      const options = await generateSubjectVariations(activeIssue);
      if (options.length > 0) {
        onUpdateSubjectOptions(options);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to generate subject line options.'
      );
    } finally {
      setIsRefreshingSubjects(false);
    }
  };

  const { design } = activeIssue;
  const headingFontClass =
    design.typography === 'modern-sans' ? 'font-sans' : 'font-serif';
  const bodyFontClass =
    design.typography === 'book-monograph' ? 'font-serif' : 'font-sans';
  const headerCentered = design.headerLayout === 'masthead';

  const renderPreviewBlock = (block: NewsletterBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <div key={block.id} className="pt-5 pb-1.5">
            {block.kicker.trim() && (
              <p
                className="text-[11px] uppercase tracking-wider mb-1"
                style={{ color: design.mutedColor }}
              >
                {block.kicker}
              </p>
            )}
            <h2
              className={`${headingFontClass} font-semibold tracking-tight leading-snug ${
                block.level === 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
              }`}
              style={{ color: design.textColor }}
            >
              {block.text}
            </h2>
          </div>
        );

      case 'paragraph':
        return (
          <p
            key={block.id}
            className={`${bodyFontClass} text-[15px] leading-[1.75] py-2 ${
              block.dropCap ? 'editorial-drop-cap' : ''
            }`}
            style={{ color: design.textColor }}
          >
            <RichInlineText text={block.text} accentColor={design.accentColor} />
          </p>
        );

      case 'image':
        return (
          <figure key={block.id} className="py-3.5">
            <div
              className={`w-full overflow-hidden rounded border ${
                block.aspect === '4:3' ? 'aspect-[4/3]' : 'aspect-video'
              }`}
              style={{ borderColor: design.borderColor }}
            >
              <ResilientImage
                src={block.src}
                alt={block.alt}
                fallbackTitle={block.caption}
              />
            </div>
            {block.caption.trim() && (
              <figcaption
                className="text-xs italic mt-2"
                style={{ color: design.mutedColor }}
              >
                {block.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'quote':
        return (
          <blockquote
            key={block.id}
            className="my-5 py-5 px-4 text-center border-y"
            style={{ borderColor: design.borderColor }}
          >
            <p
              className={`${headingFontClass} text-lg sm:text-xl italic leading-relaxed`}
              style={{ color: design.textColor }}
            >
              “{block.text}”
            </p>
            {block.attribution.trim() && (
              <footer className="text-xs mt-2.5" style={{ color: design.mutedColor }}>
                — {block.attribution}
              </footer>
            )}
          </blockquote>
        );

      case 'links':
        return (
          <section key={block.id} className="py-4">
            {block.heading.trim() && (
              <h3
                className={`${headingFontClass} text-lg font-semibold tracking-tight mb-2.5`}
                style={{ color: design.textColor }}
              >
                {block.heading}
              </h3>
            )}
            <ul className="divide-y" style={{ borderColor: design.borderColor }}>
              {block.items.map((item) => {
                const safe = sanitizeUrl(item.url);
                return (
                  <li
                    key={item.id}
                    className="py-3 first:pt-2.5"
                    style={{ borderColor: design.borderColor }}
                  >
                    <div className="leading-snug">
                      {safe ? (
                        <a
                          href={safe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] font-semibold underline underline-offset-4 decoration-1"
                          style={{ color: design.accentColor }}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span
                          className="text-[15px] font-semibold"
                          style={{ color: design.textColor }}
                        >
                          {item.title}
                        </span>
                      )}
                      {item.source.trim() && (
                        <span className="text-xs ml-1.5" style={{ color: design.mutedColor }}>
                          · {item.source}
                        </span>
                      )}
                    </div>
                    {item.note.trim() && (
                      <p
                        className={`${bodyFontClass} text-sm leading-relaxed mt-1`}
                        style={{ color: design.mutedColor }}
                      >
                        {item.note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );

      case 'callout':
        return (
          <div
            key={block.id}
            className="my-4 p-4 sm:p-5 rounded-md border"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            {block.title.trim() && (
              <p
                className={`${headingFontClass} text-base font-semibold mb-1`}
                style={{ color: design.textColor }}
              >
                {block.title}
              </p>
            )}
            <p
              className={`${bodyFontClass} text-sm leading-relaxed`}
              style={{ color: design.mutedColor }}
            >
              <RichInlineText text={block.body} accentColor={design.accentColor} />
            </p>
          </div>
        );

      case 'button': {
        const safe = sanitizeUrl(block.url);
        const solid = block.variant === 'solid';
        return (
          <div
            key={block.id}
            className={`py-4 ${block.alignment === 'center' ? 'text-center' : 'text-left'}`}
          >
            <a
              href={safe || '#'}
              target={safe ? '_blank' : undefined}
              rel={safe ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (!safe) e.preventDefault();
              }}
              className="inline-block px-5 py-2.5 rounded-md text-xs font-semibold"
              style={
                solid
                  ? {
                      backgroundColor: design.accentColor,
                      color: '#FFFFFF',
                      border: `1px solid ${design.accentColor}`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: design.accentColor,
                      border: `1px solid ${design.accentColor}`,
                    }
              }
            >
              {block.label}
            </a>
          </div>
        );
      }

      case 'metrics':
        return (
          <section key={block.id} className="py-4">
            {block.heading.trim() && (
              <p
                className="text-[11px] uppercase tracking-wider mb-2.5"
                style={{ color: design.mutedColor }}
              >
                {block.heading}
              </p>
            )}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3.5 border-y"
              style={{ borderColor: design.borderColor }}
            >
              {block.items.map((item) => (
                <div key={item.id}>
                  <p
                    className={`${headingFontClass} text-xl font-semibold tabular-nums`}
                    style={{ color: design.textColor }}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: design.textColor }}>
                    {item.label}
                  </p>
                  {item.detail.trim() && (
                    <p className="text-[11px] mt-0.5" style={{ color: design.mutedColor }}>
                      {item.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'divider':
        if (block.style === 'space') return <div key={block.id} className="h-6" />;
        if (block.style === 'dinkus') {
          return (
            <p
              key={block.id}
              className="py-4 text-center font-serif text-sm tracking-[0.6em]"
              style={{ color: design.mutedColor }}
            >
              * * *
            </p>
          );
        }
        return (
          <div key={block.id} className="py-4">
            <div className="h-px w-full" style={{ backgroundColor: design.borderColor }} />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-60px)]">
      {/* Left Column: Brief & Generation Controls */}
      <section
        aria-label="Newsletter generator brief"
        className="w-full lg:w-[460px] xl:w-[500px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 overflow-y-auto"
      >
        <form onSubmit={handleGenerate} className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-[28px] font-semibold tracking-tight text-neutral-950 leading-tight [text-wrap:balance]">
              Generate a Newsletter Issue
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
              Describe your topic or paste raw notes to generate a complete, structured issue with subject line options and email-ready HTML.
            </p>
          </div>

          {/* Topic Brief */}
          <div className="space-y-2">
            <label htmlFor="gen-topic" className="block text-xs font-semibold text-neutral-900">
              What is this issue about?
            </label>
            <textarea
              id="gen-topic"
              rows={4}
              value={brief.topic}
              onChange={(e) => {
                setBrief((prev) => ({ ...prev, topic: e.target.value }));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Example: A weekly briefing on practical AI workflows for small architecture studios, including 3 curated reads and a reader question..."
              className="w-full px-3.5 py-3 text-sm bg-white border border-neutral-200 rounded-md text-neutral-900 placeholder:text-neutral-400 focus:border-[#1D4ED8] transition-colors leading-relaxed resize-y"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 text-xs">
              <span className="text-neutral-400">Try a brief:</span>
              {SAMPLE_BRIEFS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setBrief((prev) => ({ ...prev, ...sample.brief }));
                    setErrorMessage(null);
                  }}
                  className="text-neutral-600 hover:text-[#1D4ED8] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#1D4ED8] transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Blueprint */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold text-neutral-900">
              Newsletter Format
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: 'essay',
                    title: 'Long-Form Essay',
                    desc: 'Narrative arc & pull quote',
                  },
                  {
                    id: 'digest',
                    title: 'Curated Digest',
                    desc: 'Annotated weekly links',
                  },
                  {
                    id: 'product',
                    title: 'Product Update',
                    desc: 'Highlights & release CTA',
                  },
                  {
                    id: 'letter',
                    title: 'Member Letter',
                    desc: 'Direct personal cadence',
                  },
                ] as { id: GeneratorFormat; title: string; desc: string }[]
              ).map((opt) => {
                const active = brief.format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectFormat(opt.id)}
                    className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-[#EFF6FF]/45'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-neutral-900">{opt.title}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-1.5">
            <label htmlFor="gen-audience" className="block text-xs font-semibold text-neutral-900">
              Target Readers
            </label>
            <input
              id="gen-audience"
              type="text"
              value={brief.audience}
              onChange={(e) => setBrief((prev) => ({ ...prev, audience: e.target.value }))}
              placeholder="Who is opening this email?"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
            />
          </div>

          {/* Voice & Reading Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-neutral-900">Voice & Tone</span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-md">
                {(
                  [
                    { id: 'editorial', label: 'Editorial' },
                    { id: 'analytical', label: 'Analytical' },
                    { id: 'warm', label: 'Warm' },
                    { id: 'concise', label: 'Concise' },
                  ] as { id: GeneratorTone; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrief((prev) => ({ ...prev, tone: item.id }))}
                    className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      brief.tone === item.id
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-neutral-900">Reading Length</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-md">
                {(
                  [
                    { id: 'short', label: '2 min' },
                    { id: 'medium', label: '4 min' },
                    { id: 'deep', label: '6 min' },
                  ] as { id: GeneratorLength; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrief((prev) => ({ ...prev, length: item.id }))}
                    className={`py-1.5 px-2 text-xs font-mono tabular-nums font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      brief.length === item.id
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Paper & Ink Theme */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-neutral-900">Visual Style</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((themeId) => {
                const preset = THEME_PRESETS[themeId];
                const active = brief.themeId === themeId;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => setBrief((prev) => ({ ...prev, themeId }))}
                    className={`px-3 py-2 rounded-md border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-[#EFF6FF]/45 text-neutral-950 font-medium'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="truncate">{preset.name}</span>
                    <span className="flex items-center gap-1 shrink-0" aria-hidden="true">
                      <span
                        className="w-3 h-3 rounded-xs border border-neutral-300"
                        style={{ backgroundColor: preset.design.backgroundColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-xs"
                        style={{ backgroundColor: preset.design.accentColor }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Structural Sections */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold text-neutral-900">
              Sections to Include
            </span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-neutral-700">
              {(
                [
                  { key: 'includeCoverImage', label: 'Cover photograph' },
                  { key: 'includeQuote', label: 'Pull quote' },
                  { key: 'includeLinks', label: 'Curated links list' },
                  { key: 'includeMetrics', label: 'Key figures strip' },
                  { key: 'includeCallout', label: 'Editor’s note' },
                  { key: 'includeCta', label: 'Closing CTA button' },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={brief[item.key]}
                    onChange={(e) =>
                      setBrief((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="w-3.5 h-3.5 rounded border-neutral-300 accent-[#1D4ED8]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Collapsible Source Notes & Publication Name */}
          <div className="pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between py-1 text-xs font-medium text-neutral-600 hover:text-neutral-950 cursor-pointer"
            >
              <span>Source notes, publication name & byline (optional)</span>
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="gen-pub"
                      className="block text-[11px] text-neutral-500 mb-1"
                    >
                      Publication name
                    </label>
                    <input
                      id="gen-pub"
                      type="text"
                      value={brief.publicationName}
                      onChange={(e) =>
                        setBrief((prev) => ({ ...prev, publicationName: e.target.value }))
                      }
                      placeholder="Auto-named if blank"
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gen-author"
                      className="block text-[11px] text-neutral-500 mb-1"
                    >
                      Author / Sender
                    </label>
                    <input
                      id="gen-author"
                      type="text"
                      value={brief.authorName}
                      onChange={(e) =>
                        setBrief((prev) => ({ ...prev, authorName: e.target.value }))
                      }
                      placeholder="e.g. Clara Lindqvist"
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gen-notes"
                    className="block text-[11px] text-neutral-500 mb-1"
                  >
                    Raw notes, bullet points, or changelog text
                  </label>
                  <textarea
                    id="gen-notes"
                    rows={4}
                    value={brief.sourceNotes}
                    onChange={(e) =>
                      setBrief((prev) => ({ ...prev, sourceNotes: e.target.value }))
                    }
                    placeholder="Paste rough talking points, stats, or excerpts you want woven into the newsletter..."
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-md focus:border-[#1D4ED8] resize-y leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 px-5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating newsletter issue…</span>
              </>
            ) : (
              <>
                <span>Generate Newsletter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* Right Column: Live Generated Newsletter & Subject Line Lab */}
      <section
        aria-label="Generated newsletter output"
        className="flex-1 bg-[#F4F4F5] flex flex-col min-w-0"
      >
        {/* Top Result Utility Bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
            <span className="font-medium text-neutral-900">
              {hasGeneratedInSession ? 'Generated Issue' : 'Active Issue'}{' '}
              {activeIssue.issueNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats.wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats.readingMinutes} min read</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {(stats.htmlBytes / 1024).toFixed(1)} KB HTML
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-800 hover:border-neutral-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Edit Blocks</span>
            </button>
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-800 hover:border-neutral-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Preview</span>
            </button>
            <button
              type="button"
              onClick={onOpenExport}
              className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              Export
            </button>
          </div>
        </div>

        {/* Scrollable Generated Output Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="max-w-[680px] mx-auto space-y-6">
            {/* Subject Line & Preheader Selector */}
            <div className="bg-white border border-neutral-200 rounded-md p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-xs font-semibold text-neutral-900">
                    Subject Line & Preheader Options
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Select a subject pairing to update this issue’s inbox headline.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isRefreshingSubjects || isGenerating}
                  onClick={handleMoreSubjects}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshingSubjects ? 'animate-spin' : ''}`}
                  />
                  <span>{isRefreshingSubjects ? 'Generating…' : 'New Subject Ideas'}</span>
                </button>
              </div>

              {subjectOptions.length > 0 ? (
                <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                  {subjectOptions.map((opt, idx) => {
                    const selected =
                      opt.subject.trim() === activeIssue.subject.trim() &&
                      opt.preheader.trim() === activeIssue.preheader.trim();
                    return (
                      <button
                        key={`${opt.subject}-${idx}`}
                        type="button"
                        onClick={() => onApplySubjectOption(opt)}
                        className={`w-full text-left py-3 px-2 -mx-2 rounded transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                          selected ? 'bg-[#EFF6FF]/60' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                            <span className="font-medium text-neutral-700">{opt.angle}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {opt.subject.length} chars
                            </span>
                          </div>
                          <p className="text-sm font-medium text-neutral-900 mt-0.5 leading-snug">
                            {opt.subject}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                            {opt.preheader}
                          </p>
                        </div>
                        <div className="shrink-0 pt-1">
                          {selected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8]">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">Apply</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                  Generate a newsletter on the left or click “New Subject Ideas” to compare subject lines for the current issue.
                </p>
              )}
            </div>

            {/* Rendered Newsletter Sheet */}
            {isGenerating ? (
              <div className="bg-white border border-neutral-200 rounded-md px-8 sm:px-12 py-14 space-y-6">
                <div className="space-y-3 border-b border-neutral-200 pb-6">
                  <div className="h-3 w-44 bg-neutral-100 rounded" />
                  <div className="h-8 w-3/4 bg-neutral-100 rounded" />
                  <div className="h-4 w-5/6 bg-neutral-100 rounded" />
                </div>
                <div className="space-y-2.5">
                  <div className="h-3.5 w-full bg-neutral-100 rounded" />
                  <div className="h-3.5 w-11/12 bg-neutral-100 rounded" />
                  <div className="h-3.5 w-4/5 bg-neutral-100 rounded" />
                </div>
                <div className="space-y-2.5 pt-2">
                  <div className="h-5 w-1/2 bg-neutral-100 rounded" />
                  <div className="h-3.5 w-full bg-neutral-100 rounded" />
                  <div className="h-3.5 w-10/12 bg-neutral-100 rounded" />
                </div>
                <p className="text-xs text-neutral-500 pt-4">
                  Drafting headline, editorial sections, and structured email blocks…
                </p>
              </div>
            ) : (
              <article
                className="rounded-md border px-6 sm:px-11 py-10 transition-colors"
                style={{
                  backgroundColor: design.backgroundColor,
                  borderColor: design.borderColor,
                }}
              >
                <header
                  className={`pb-6 mb-5 border-b ${
                    headerCentered ? 'text-center' : 'text-left'
                  }`}
                  style={{ borderColor: design.borderColor }}
                >
                  <p
                    className="text-xs uppercase tracking-wider mb-2.5"
                    style={{ color: design.mutedColor }}
                  >
                    {activeIssue.publicationName} · Issue {activeIssue.issueNumber} ·{' '}
                    {activeIssue.publishDate}
                  </p>
                  <h2
                    className={`${headingFontClass} text-2xl sm:text-3xl font-semibold tracking-tight leading-tight [text-wrap:balance]`}
                    style={{ color: design.textColor }}
                  >
                    {activeIssue.subject || 'Untitled newsletter issue'}
                  </h2>
                  {design.headerLayout !== 'minimal' && activeIssue.preheader.trim() && (
                    <p
                      className={`${bodyFontClass} text-sm sm:text-base leading-relaxed mt-2.5`}
                      style={{ color: design.mutedColor }}
                    >
                      {activeIssue.preheader}
                    </p>
                  )}
                  {design.headerLayout !== 'minimal' && (
                    <p className="text-xs mt-3.5" style={{ color: design.mutedColor }}>
                      By {activeIssue.authorName}
                    </p>
                  )}
                </header>

                <div>{activeIssue.blocks.map(renderPreviewBlock)}</div>

                <footer
                  className={`mt-8 pt-6 border-t text-xs leading-relaxed space-y-1 ${
                    headerCentered ? 'text-center' : 'text-left'
                  }`}
                  style={{ borderColor: design.borderColor, color: design.mutedColor }}
                >
                  <p>{activeIssue.footerNote}</p>
                  <p>{activeIssue.addressLine}</p>
                  <p className="underline underline-offset-2 opacity-80">
                    {activeIssue.unsubscribeLabel}
                  </p>
                </footer>
              </article>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
