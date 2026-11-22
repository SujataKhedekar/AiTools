import { Check, Copy, Monitor, Moon, Smartphone, Sun } from 'lucide-react';
import { useState } from 'react';
import { NewsletterBlock, NewsletterIssue } from '../types/newsletter';
import { generateEmailHtml, generatePlainText, sanitizeUrl } from '../utils/newsletterExport';
import { ResilientImage } from './ResilientImage';
import { RichInlineText } from './RichInlineText';

interface NewsletterPreviewProps {
  issue: NewsletterIssue;
  onOpenExport: () => void;
}

export function NewsletterPreview({ issue, onOpenExport }: NewsletterPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [darkInbox, setDarkInbox] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  const { design } = issue;
  const headingFontClass =
    design.typography === 'modern-sans' ? 'font-sans' : 'font-serif';
  const bodyFontClass =
    design.typography === 'book-monograph' ? 'font-serif' : 'font-sans';

  // Dark inbox simulation adapts paper/ink cleanly while preserving accent intent
  const sheetBg = darkInbox ? '#141416' : design.backgroundColor;
  const sheetSurface = darkInbox ? '#1E1E22' : design.surfaceColor;
  const sheetText = darkInbox ? '#F4F4F5' : design.textColor;
  const sheetMuted = darkInbox ? '#A1A1AA' : design.mutedColor;
  const sheetBorder = darkInbox ? '#2B2B30' : design.borderColor;
  const sheetAccent = darkInbox ? '#60A5FA' : design.accentColor;

  const headerCentered = design.headerLayout === 'masthead';

  const handleCopyRichEmail = async () => {
    const html = generateEmailHtml(issue);
    const plain = generatePlainText(issue);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2200);
    } catch {
      onOpenExport();
    }
  };

  const renderBlock = (block: NewsletterBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <div key={block.id} className="pt-6 pb-2">
            {block.kicker.trim() && (
              <p
                className="text-xs uppercase tracking-wider mb-1.5"
                style={{ color: sheetMuted }}
              >
                {block.kicker}
              </p>
            )}
            {block.level === 2 ? (
              <h2
                className={`${headingFontClass} text-2xl font-semibold tracking-tight leading-snug`}
                style={{ color: sheetText }}
              >
                {block.text}
              </h2>
            ) : (
              <h3
                className={`${headingFontClass} text-xl font-semibold tracking-tight leading-snug`}
                style={{ color: sheetText }}
              >
                {block.text}
              </h3>
            )}
          </div>
        );

      case 'paragraph':
        return (
          <p
            key={block.id}
            className={`${bodyFontClass} text-[16px] leading-[1.75] py-2 ${
              block.dropCap ? 'editorial-drop-cap' : ''
            }`}
            style={{ color: sheetText }}
          >
            <RichInlineText text={block.text} accentColor={sheetAccent} />
          </p>
        );

      case 'image':
        return (
          <figure key={block.id} className="py-4">
            <div
              className={`w-full overflow-hidden rounded border ${
                block.aspect === '16:9'
                  ? 'aspect-video'
                  : block.aspect === '4:3'
                  ? 'aspect-[4/3]'
                  : ''
              }`}
              style={{ borderColor: sheetBorder }}
            >
              <ResilientImage
                src={block.src}
                alt={block.alt}
                fallbackTitle={block.caption}
              />
            </div>
            {block.caption.trim() && (
              <figcaption
                className="text-xs italic mt-2.5 leading-relaxed"
                style={{ color: sheetMuted }}
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
            className="my-6 py-6 px-4 text-center border-y"
            style={{ borderColor: sheetBorder }}
          >
            <p
              className={`${headingFontClass} text-xl sm:text-[22px] italic leading-relaxed`}
              style={{ color: sheetText }}
            >
              “{block.text}”
            </p>
            {block.attribution.trim() && (
              <footer className="text-xs mt-3" style={{ color: sheetMuted }}>
                — {block.attribution}
              </footer>
            )}
          </blockquote>
        );

      case 'links':
        return (
          <section key={block.id} className="py-5">
            {block.heading.trim() && (
              <h3
                className={`${headingFontClass} text-xl font-semibold tracking-tight mb-3`}
                style={{ color: sheetText }}
              >
                {block.heading}
              </h3>
            )}
            <ul className="divide-y" style={{ borderColor: sheetBorder }}>
              {block.items.map((item) => {
                const safe = sanitizeUrl(item.url);
                return (
                  <li
                    key={item.id}
                    className="py-3.5 first:pt-3"
                    style={{ borderColor: sheetBorder }}
                  >
                    <div className="leading-snug">
                      {safe ? (
                        <a
                          href={safe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] font-semibold underline underline-offset-4 decoration-1 hover:opacity-80"
                          style={{ color: sheetAccent }}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span
                          className="text-[15px] font-semibold"
                          style={{ color: sheetText }}
                        >
                          {item.title}
                        </span>
                      )}
                      {item.source.trim() && (
                        <span className="text-xs ml-1.5" style={{ color: sheetMuted }}>
                          · {item.source}
                        </span>
                      )}
                    </div>
                    {item.note.trim() && (
                      <p
                        className={`${bodyFontClass} text-sm leading-relaxed mt-1.5`}
                        style={{ color: sheetMuted }}
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
            className="my-5 p-5 rounded-md border"
            style={{ backgroundColor: sheetSurface, borderColor: sheetBorder }}
          >
            {block.title.trim() && (
              <p
                className={`${headingFontClass} text-base font-semibold mb-1.5`}
                style={{ color: sheetText }}
              >
                {block.title}
              </p>
            )}
            <p
              className={`${bodyFontClass} text-[15px] leading-relaxed`}
              style={{ color: sheetMuted }}
            >
              <RichInlineText text={block.body} accentColor={sheetAccent} />
            </p>
          </div>
        );

      case 'button': {
        const safe = sanitizeUrl(block.url);
        const solid = block.variant === 'solid';
        const btnStyle = solid
          ? {
              backgroundColor: sheetAccent,
              color: darkInbox ? '#0A0A0B' : '#FFFFFF',
              border: `1px solid ${sheetAccent}`,
            }
          : {
              backgroundColor: 'transparent',
              color: sheetAccent,
              border: `1px solid ${sheetAccent}`,
            };

        return (
          <div
            key={block.id}
            className={`py-5 ${block.alignment === 'center' ? 'text-center' : 'text-left'}`}
          >
            <a
              href={safe || '#'}
              target={safe ? '_blank' : undefined}
              rel={safe ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (!safe) e.preventDefault();
              }}
              className="inline-block px-6 py-3 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
              style={btnStyle}
            >
              {block.label}
            </a>
          </div>
        );
      }

      case 'metrics':
        return (
          <section key={block.id} className="py-5">
            {block.heading.trim() && (
              <p
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: sheetMuted }}
              >
                {block.heading}
              </p>
            )}
            <div
              className={`grid gap-4 py-4 border-y ${
                viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'
              }`}
              style={{ borderColor: sheetBorder }}
            >
              {block.items.map((item) => (
                <div key={item.id}>
                  <p
                    className={`${headingFontClass} text-2xl font-semibold tabular-nums`}
                    style={{ color: sheetText }}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs font-semibold mt-1" style={{ color: sheetText }}>
                    {item.label}
                  </p>
                  {item.detail.trim() && (
                    <p className="text-xs mt-0.5" style={{ color: sheetMuted }}>
                      {item.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'divider':
        if (block.style === 'space') {
          return <div key={block.id} className="h-7" />;
        }
        if (block.style === 'dinkus') {
          return (
            <p
              key={block.id}
              className="py-5 text-center font-serif text-base tracking-[0.6em]"
              style={{ color: sheetMuted }}
            >
              * * *
            </p>
          );
        }
        return (
          <div key={block.id} className="py-5">
            <div className="h-px w-full" style={{ backgroundColor: sheetBorder }} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-61px)] bg-[#F4F4F5] flex flex-col">
      {/* Preview Toolbar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop ({design.maxWidth}px)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDarkInbox((d) => !d)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            {darkInbox ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkInbox ? 'Light inbox' : 'Dark inbox test'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyRichEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedRich ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied for Gmail / Substack</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Rich Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rendered Email Client Frame */}
      <div className="flex-1 py-10 px-4 flex justify-center overflow-y-auto">
        <div
          className="w-full transition-all duration-200"
          style={{
            maxWidth: viewport === 'mobile' ? '375px' : `${design.maxWidth + 48}px`,
          }}
        >
          {/* Email Envelope Header Chrome */}
          <div
            className={`px-5 py-4 rounded-t-lg border border-b-0 text-xs space-y-1.5 ${
              darkInbox
                ? 'bg-[#1C1C1F] border-[#2B2B30] text-neutral-300'
                : 'bg-white border-neutral-200 text-neutral-600'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p
                className={`font-semibold text-sm truncate ${
                  darkInbox ? 'text-neutral-100' : 'text-neutral-900'
                }`}
              >
                {issue.subject || 'Untitled newsletter issue'}
              </p>
              <span className="font-mono tabular-nums text-[11px] shrink-0 opacity-70">
                {issue.publishDate}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-80">
              <span>
                From: <strong className="font-medium">{issue.authorName}</strong> &lt;
                {issue.senderEmail}&gt;
              </span>
              <span aria-hidden="true">·</span>
              <span>To: Subscribers</span>
            </div>
          </div>

          {/* Email Paper Container */}
          <article
            className="rounded-b-lg border px-6 sm:px-10 py-10 transition-colors"
            style={{
              backgroundColor: sheetBg,
              borderColor: sheetBorder,
            }}
          >
            {/* Masthead */}
            <header
              className={`pb-7 mb-5 border-b ${headerCentered ? 'text-center' : 'text-left'}`}
              style={{ borderColor: sheetBorder }}
            >
              <p
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: sheetMuted }}
              >
                {issue.publicationName} · Issue {issue.issueNumber} · {issue.publishDate}
              </p>
              <h1
                className={`${headingFontClass} text-3xl sm:text-[34px] font-semibold tracking-tight leading-[1.18] [text-wrap:balance]`}
                style={{ color: sheetText }}
              >
                {issue.subject || 'Untitled newsletter issue'}
              </h1>
              {design.headerLayout !== 'minimal' && issue.preheader.trim() && (
                <p
                  className={`${bodyFontClass} text-base leading-relaxed mt-3`}
                  style={{ color: sheetMuted }}
                >
                  {issue.preheader}
                </p>
              )}
              {design.headerLayout !== 'minimal' && (
                <p className="text-xs mt-4" style={{ color: sheetMuted }}>
                  By {issue.authorName}
                </p>
              )}
            </header>

            {/* Modular Blocks */}
            <div>{issue.blocks.map(renderBlock)}</div>

            {/* Footer */}
            <footer
              className={`mt-10 pt-6 border-t text-xs leading-relaxed space-y-1.5 ${
                headerCentered ? 'text-center' : 'text-left'
              }`}
              style={{ borderColor: sheetBorder, color: sheetMuted }}
            >
              <p>{issue.footerNote}</p>
              <p>{issue.addressLine}</p>
              <p className="pt-1">
                <a
                  href="#unsubscribe"
                  onClick={(e) => e.preventDefault()}
                  className="underline underline-offset-2"
                  style={{ color: sheetMuted }}
                >
                  {issue.unsubscribeLabel}
                </a>
              </p>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
