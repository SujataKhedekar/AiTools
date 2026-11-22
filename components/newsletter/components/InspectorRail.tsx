import { AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ACCENT_SWATCHES, THEME_PRESETS } from '../data/presets';
import { generateSubjectVariations } from '../services/newsletterApi';
import {
  EditorialCheck,
  HeaderLayout,
  IssueStats,
  NewsletterDesign,
  NewsletterIssue,
  SubjectOption,
  ThemePresetId,
  TypographyPreset,
} from '../types/newsletter';

interface InspectorRailProps {
  issue: NewsletterIssue;
  stats: IssueStats;
  checks: EditorialCheck[];
  onChangeIssue: (patch: Partial<NewsletterIssue>) => void;
  onChangeDesign: (patch: Partial<NewsletterDesign>) => void;
}

type InspectorTab = 'envelope' | 'design' | 'checks';

export function InspectorRail({
  issue,
  stats,
  checks,
  onChangeIssue,
  onChangeDesign,
}: InspectorRailProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('envelope');
  const [subjectIdeas, setSubjectIdeas] = useState<SubjectOption[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);

  const handleFetchIdeas = async () => {
    setIdeasError(null);
    setLoadingIdeas(true);
    try {
      const options = await generateSubjectVariations(issue);
      setSubjectIdeas(options);
    } catch (err) {
      setIdeasError(err instanceof Error ? err.message : 'Unable to generate subject ideas.');
    } finally {
      setLoadingIdeas(false);
    }
  };

  const subjectChars = issue.subject.trim().length;
  const preheaderChars = issue.preheader.trim().length;
  const passCount = checks.filter((c) => c.status === 'pass').length;

  const subjectHint =
    subjectChars === 0
      ? 'Required'
      : subjectChars <= 55
      ? 'Optimal'
      : subjectChars <= 68
      ? 'May clip on mobile'
      : 'Too long';

  const preheaderHint =
    preheaderChars === 0
      ? 'Recommended'
      : preheaderChars <= 95
      ? 'Optimal'
      : 'May clip in inbox';

  return (
    <aside
      aria-label="Issue inspector"
      className="w-full lg:w-[296px] xl:w-[312px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white flex flex-col"
    >
      {/* Inspector Tab Switcher */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-200">
        <div
          role="tablist"
          aria-label="Inspector sections"
          className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-md"
        >
          {(
            [
              { id: 'envelope', label: 'Envelope' },
              { id: 'design', label: 'Design' },
              { id: 'checks', label: `Checks (${passCount}/${checks.length})` },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspector Body */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {activeTab === 'envelope' && (
          <>
            {/* Live Inbox Preview */}
            <section aria-labelledby="inbox-preview-heading">
              <div className="flex items-center justify-between mb-2">
                <h2
                  id="inbox-preview-heading"
                  className="text-xs font-semibold text-neutral-900"
                >
                  Inbox Preview
                </h2>
                <span className="text-[11px] text-neutral-500">Reader view</span>
              </div>
              <div className="p-3.5 bg-[#FAFAFA] border border-neutral-200 rounded-md">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {issue.authorName || issue.publicationName || 'Sender Name'}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-400 shrink-0">
                    9:00 AM
                  </span>
                </div>
                <p className="text-[13px] font-medium text-neutral-900 mt-1 leading-snug line-clamp-1">
                  {issue.subject || 'Untitled newsletter issue'}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-snug line-clamp-2">
                  {issue.preheader || 'Add preheader text to guide readers before they open.'}
                </p>
              </div>
            </section>

            {/* Subject & Preheader Guidance */}
            <section className="space-y-4 pt-4 border-t border-neutral-100">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="inspector-subject" className="font-medium text-neutral-800">
                    Subject line
                  </label>
                  <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                    {subjectChars} / 55 · {subjectHint}
                  </span>
                </div>
                <input
                  id="inspector-subject"
                  type="text"
                  value={issue.subject}
                  onChange={(e) => onChangeIssue({ subject: e.target.value })}
                  placeholder="Write a clear, specific subject..."
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="inspector-preheader" className="font-medium text-neutral-800">
                    Preheader text
                  </label>
                  <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                    {preheaderChars} / 95 · {preheaderHint}
                  </span>
                </div>
                <textarea
                  id="inspector-preheader"
                  rows={2}
                  value={issue.preheader}
                  onChange={(e) => onChangeIssue({ preheader: e.target.value })}
                  placeholder="Preview line shown beside the subject in email clients..."
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8] transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  disabled={loadingIdeas}
                  onClick={handleFetchIdeas}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border border-neutral-200 text-xs font-medium text-neutral-800 hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingIdeas ? 'animate-spin' : ''}`} />
                  <span>{loadingIdeas ? 'Generating ideas…' : 'Generate Subject Ideas'}</span>
                </button>
                {ideasError && <p className="text-[11px] text-rose-700">{ideasError}</p>}
                {subjectIdeas.length > 0 && (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-md bg-[#FAFAFA]">
                    {subjectIdeas.map((idea, idx) => (
                      <button
                        key={`${idea.subject}-${idx}`}
                        type="button"
                        onClick={() =>
                          onChangeIssue({
                            subject: idea.subject,
                            preheader: idea.preheader,
                          })
                        }
                        className="w-full text-left p-2.5 hover:bg-white transition-colors cursor-pointer"
                      >
                        <p className="text-[11px] text-neutral-500">
                          {idea.angle} · {idea.subject.length} chars
                        </p>
                        <p className="text-xs font-medium text-neutral-900 mt-0.5 leading-snug">
                          {idea.subject}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                          {idea.preheader}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Publication & Sender Details */}
            <section className="space-y-3.5 pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900">Publication Details</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor="pub-name" className="block text-[11px] text-neutral-500 mb-1">
                    Publication
                  </label>
                  <input
                    id="pub-name"
                    type="text"
                    value={issue.publicationName}
                    onChange={(e) => onChangeIssue({ publicationName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label htmlFor="issue-num" className="block text-[11px] text-neutral-500 mb-1">
                    Issue #
                  </label>
                  <input
                    id="issue-num"
                    type="text"
                    value={issue.issueNumber}
                    onChange={(e) => onChangeIssue({ issueNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="author-name" className="block text-[11px] text-neutral-500 mb-1">
                  Author / From name
                </label>
                <input
                  id="author-name"
                  type="text"
                  value={issue.authorName}
                  onChange={(e) => onChangeIssue({ authorName: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label htmlFor="sender-email" className="block text-[11px] text-neutral-500 mb-1">
                  Reply-to address
                </label>
                <input
                  id="sender-email"
                  type="email"
                  value={issue.senderEmail}
                  onChange={(e) => onChangeIssue({ senderEmail: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label htmlFor="publish-date" className="block text-[11px] text-neutral-500 mb-1">
                  Publish date
                </label>
                <input
                  id="publish-date"
                  type="text"
                  value={issue.publishDate}
                  onChange={(e) => onChangeIssue({ publishDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>
            </section>

            {/* Footer & Compliance */}
            <section className="space-y-3 pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900">Footer & Compliance</h3>
              <div>
                <label htmlFor="footer-note" className="block text-[11px] text-neutral-500 mb-1">
                  Permission reminder
                </label>
                <textarea
                  id="footer-note"
                  rows={2}
                  value={issue.footerNote}
                  onChange={(e) => onChangeIssue({ footerNote: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8] resize-none"
                />
              </div>
              <div>
                <label htmlFor="address-line" className="block text-[11px] text-neutral-500 mb-1">
                  Mailing address
                </label>
                <input
                  id="address-line"
                  type="text"
                  value={issue.addressLine}
                  onChange={(e) => onChangeIssue({ addressLine: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label htmlFor="unsub-label" className="block text-[11px] text-neutral-500 mb-1">
                  Unsubscribe link text
                </label>
                <input
                  id="unsub-label"
                  type="text"
                  value={issue.unsubscribeLabel}
                  onChange={(e) => onChangeIssue({ unsubscribeLabel: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>
            </section>
          </>
        )}

        {activeTab === 'design' && (
          <>
            {/* Theme Presets */}
            <section>
              <h2 className="text-xs font-semibold text-neutral-900 mb-2.5">Paper & Ink Theme</h2>
              <div className="space-y-2">
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((presetKey) => {
                  const preset = THEME_PRESETS[presetKey];
                  const active = issue.design.themeId === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => onChangeDesign(preset.design)}
                      className={`w-full text-left p-3 rounded-md border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        active
                          ? 'border-[#1D4ED8] bg-[#EFF6FF]/40'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900">{preset.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                        <span
                          className="w-4 h-4 rounded-sm border border-neutral-300"
                          style={{ backgroundColor: preset.design.backgroundColor }}
                        />
                        <span
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: preset.design.accentColor }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Typography */}
            <section className="pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 mb-2.5">Typography</h3>
              <div className="space-y-1.5">
                {(
                  [
                    {
                      id: 'editorial-serif',
                      label: 'Editorial Serif',
                      desc: 'Fraunces headlines · DM Sans body',
                    },
                    {
                      id: 'book-monograph',
                      label: 'Book Monograph',
                      desc: 'Fraunces headlines · Georgia serif body',
                    },
                    {
                      id: 'modern-sans',
                      label: 'Modern Clean',
                      desc: 'DM Sans throughout',
                    },
                  ] as { id: TypographyPreset; label: string; desc: string }[]
                ).map((item) => {
                  const active = issue.design.typography === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChangeDesign({ typography: item.id })}
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#EFF6FF]/40'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-neutral-900">{item.label}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Header Layout */}
            <section className="pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 mb-2.5">Masthead Style</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'masthead', label: 'Centered' },
                    { id: 'left', label: 'Left Align' },
                    { id: 'minimal', label: 'Minimal' },
                  ] as { id: HeaderLayout; label: string }[]
                ).map((opt) => {
                  const active = issue.design.headerLayout === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeDesign({ headerLayout: opt.id })}
                      className={`py-2 px-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] text-[#1D4ED8] bg-[#EFF6FF]/40'
                          : 'border-neutral-200 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Accent Color */}
            <section className="pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 mb-2.5">Link & Button Ink</h3>
              <div className="grid grid-cols-6 gap-2">
                {ACCENT_SWATCHES.map((swatch) => {
                  const active = issue.design.accentColor.toLowerCase() === swatch.value.toLowerCase();
                  return (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.label}
                      aria-label={`Set accent color to ${swatch.label}`}
                      onClick={() => onChangeDesign({ accentColor: swatch.value })}
                      className={`h-8 rounded-md border transition-transform cursor-pointer ${
                        active ? 'ring-2 ring-offset-2 ring-neutral-900 border-transparent' : 'border-black/10 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.value }}
                    />
                  );
                })}
              </div>
            </section>

            {/* Column Width */}
            <section className="pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 mb-2.5">Reading Measure</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {([580, 620, 680] as const).map((width) => {
                  const active = issue.design.maxWidth === width;
                  return (
                    <button
                      key={width}
                      type="button"
                      onClick={() => onChangeDesign({ maxWidth: width })}
                      className={`py-2 px-2 text-xs font-mono tabular-nums rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] text-[#1D4ED8] bg-[#EFF6FF]/40'
                          : 'border-neutral-200 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {width}px
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'checks' && (
          <>
            {/* Editorial Stats Summary */}
            <section className="grid grid-cols-2 gap-3 pb-4 border-b border-neutral-200">
              <div>
                <p className="text-[11px] text-neutral-500">Word count</p>
                <p className="text-lg font-mono tabular-nums font-medium text-neutral-900 mt-0.5">
                  {stats.wordCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Reading time</p>
                <p className="text-lg font-mono tabular-nums font-medium text-neutral-900 mt-0.5">
                  {stats.readingMinutes} min
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">HTML weight</p>
                <p className="text-sm font-mono tabular-nums text-neutral-800 mt-0.5">
                  {(stats.htmlBytes / 1024).toFixed(1)} KB
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Links & images</p>
                <p className="text-sm font-mono tabular-nums text-neutral-800 mt-0.5">
                  {stats.linkCount} links · {stats.imageCount} imgs
                </p>
              </div>
            </section>

            {/* Pre-Send Checklist */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-neutral-900">Pre-Send Readiness</h2>
              <ul className="divide-y divide-neutral-100">
                {checks.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 flex items-start gap-2.5">
                    {item.status === 'pass' && (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    {item.status === 'warn' && (
                      <Info
                        className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    {item.status === 'fail' && (
                      <AlertCircle
                        className="w-4 h-4 text-rose-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-900">
                        {item.label}{' '}
                        <span className="font-normal text-neutral-500">
                          — {item.status === 'pass' ? 'Passed' : item.status === 'warn' ? 'Review' : 'Action needed'}
                        </span>
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
