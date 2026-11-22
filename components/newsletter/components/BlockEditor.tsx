import {
  ArrowDown,
  ArrowUp,
  Bold,
  Code,
  Copy,
  Italic,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createId, STUDIO_IMAGES } from '../data/presets';
import { rewriteBlockText } from '../services/newsletterApi';
import { NewsletterBlock, NewsletterDesign, RewriteAction } from '../types/newsletter';
import { ResilientImage } from './ResilientImage';
import { RichInlineText } from './RichInlineText';

interface BlockEditorProps {
  block: NewsletterBlock;
  design: NewsletterDesign;
  issueSubject: string;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: NewsletterBlock) => void;
  onMove: (direction: 'up' | 'down') => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
  inputRef,
  onFocus,
  ariaLabel,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onFocus?: () => void;
  ariaLabel: string;
}) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = inputRef || internalRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={ariaLabel}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent resize-none overflow-hidden ${className || ''}`}
      style={style}
    />
  );
}

export function BlockEditor({
  block,
  design,
  issueSubject,
  index,
  total,
  isSelected,
  onSelect,
  onUpdate,
  onMove,
  onDuplicate,
  onDelete,
}: BlockEditorProps) {
  const paragraphRef = useRef<HTMLTextAreaElement | null>(null);
  const [showImageSourcePanel, setShowImageSourcePanel] = useState(false);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const canRewrite =
    block.type === 'paragraph' ||
    block.type === 'heading' ||
    block.type === 'quote' ||
    block.type === 'callout';

  const handleRewrite = async (action: RewriteAction) => {
    if (!canRewrite) return;
    const sourceText = block.type === 'callout' ? block.body : block.text;
    if (!sourceText.trim()) return;

    setShowRewriteMenu(false);
    setRewriteError(null);
    setIsRewriting(true);
    try {
      const nextText = await rewriteBlockText({
        text: sourceText,
        blockType: block.type,
        action,
        issueSubject,
      });
      if (block.type === 'callout') {
        onUpdate({ ...block, body: nextText });
      } else {
        onUpdate({ ...block, text: nextText });
      }
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Unable to rewrite block.');
    } finally {
      setIsRewriting(false);
    }
  };

  const headingFontClass =
    design.typography === 'modern-sans' ? 'font-sans' : 'font-serif';
  const bodyFontClass =
    design.typography === 'book-monograph' ? 'font-serif' : 'font-sans';

  const applyInlineWrap = (prefix: string, suffix: string, fallbackText: string) => {
    if (block.type !== 'paragraph') return;
    const el = paragraphRef.current;
    if (!el) {
      onUpdate({ ...block, text: `${block.text} ${prefix}${fallbackText}${suffix}`.trim() });
      return;
    }
    const start = el.selectionStart ?? block.text.length;
    const end = el.selectionEnd ?? block.text.length;
    const selected = block.text.slice(start, end) || fallbackText;
    const nextText =
      block.text.slice(0, start) + prefix + selected + suffix + block.text.slice(end);
    onUpdate({ ...block, text: nextText });

    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + prefix.length;
      el.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (block.type !== 'image') return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdate({
          ...block,
          src: reader.result,
          alt: block.alt || file.name.replace(/\.[^.]+$/, ''),
        });
        setShowImageSourcePanel(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      id={`editor-block-${block.id}`}
      onClick={onSelect}
      className={`group relative rounded-md transition-colors px-4 py-3 -mx-4 border ${
        isSelected
          ? 'border-[#1D4ED8]/35 bg-white/60'
          : 'border-transparent hover:border-neutral-200/80'
      }`}
    >
      {/* Floating block controls (visible on hover or when selected) */}
      <div
        className={`flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-100 transition-opacity duration-150 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span className="font-medium capitalize text-neutral-600">
            {block.type === 'links'
              ? 'Curated Links'
              : block.type === 'button'
              ? 'Call to Action'
              : block.type}
          </span>

          {/* Context-specific inline controls */}
          {block.type === 'heading' && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ ...block, level: block.level === 2 ? 3 : 2 });
                }}
                className="text-neutral-600 hover:text-neutral-900 font-mono cursor-pointer"
              >
                H{block.level}
              </button>
            </>
          )}

          {block.type === 'paragraph' && (
            <>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Bold selection"
                  aria-label="Bold selection"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyInlineWrap('**', '**', 'bold text');
                  }}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Italic selection"
                  aria-label="Italic selection"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyInlineWrap('*', '*', 'italic text');
                  }}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Insert link"
                  aria-label="Insert link"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyInlineWrap('[', '](https://example.com)', 'link label');
                  }}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Inline code"
                  aria-label="Inline code"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyInlineWrap('`', '`', 'code');
                  }}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <span aria-hidden="true" className="mx-0.5 text-neutral-300">
                  |
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...block, dropCap: !block.dropCap });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                    block.dropCap
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  Drop cap
                </button>
              </div>
            </>
          )}

          {block.type === 'image' && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageSourcePanel((v) => !v);
                }}
                className="text-[#1D4ED8] hover:underline cursor-pointer"
              >
                {showImageSourcePanel ? 'Hide image source' : 'Change image'}
              </button>
            </>
          )}

          {block.type === 'divider' && (
            <>
              <span aria-hidden="true">·</span>
              {(['hairline', 'dinkus', 'space'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...block, style });
                  }}
                  className={`px-1.5 py-0.5 rounded capitalize cursor-pointer ${
                    block.style === style
                      ? 'bg-neutral-100 text-neutral-900 font-medium'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {style}
                </button>
              ))}
            </>
          )}

          {block.type === 'button' && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({
                    ...block,
                    alignment: block.alignment === 'left' ? 'center' : 'left',
                  });
                }}
                className="text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Align: {block.alignment}
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({
                    ...block,
                    variant: block.variant === 'solid' ? 'outline' : 'solid',
                  });
                }}
                className="text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Style: {block.variant}
              </button>
            </>
          )}
        </div>

        {/* Universal block actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {canRewrite && (
            <div className="relative mr-1">
              <button
                type="button"
                disabled={isRewriting}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRewriteMenu((v) => !v);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#1D4ED8] hover:bg-[#EFF6FF] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isRewriting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isRewriting ? 'Rewriting…' : 'Rewrite'}</span>
              </button>
              {showRewriteMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-40 bg-white border border-neutral-200 rounded-md shadow-md py-1 z-20"
                >
                  {(
                    [
                      { id: 'tighten', label: 'Tighten copy' },
                      { id: 'expand', label: 'Expand with detail' },
                      { id: 'warmer', label: 'Make warmer' },
                      { id: 'sharper', label: 'Make sharper' },
                    ] as { id: RewriteAction; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleRewrite(opt.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={index === 0}
            title="Move block up"
            aria-label="Move block up"
            onClick={(e) => {
              e.stopPropagation();
              onMove('up');
            }}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            title="Move block down"
            aria-label="Move block down"
            onClick={(e) => {
              e.stopPropagation();
              onMove('down');
            }}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Duplicate block"
            aria-label="Duplicate block"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete block"
            aria-label="Delete block"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded text-neutral-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {rewriteError && (
        <p className="text-[11px] text-rose-700 mb-2">{rewriteError}</p>
      )}

      {/* Block Content Editor */}
      {block.type === 'heading' && (
        <div className="space-y-1">
          <input
            type="text"
            aria-label="Section kicker"
            value={block.kicker}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, kicker: e.target.value })}
            placeholder="Optional kicker (e.g., Part One)"
            className="w-full bg-transparent text-xs tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-300"
            style={{ color: design.mutedColor }}
          />
          <AutoTextarea
            ariaLabel="Section heading text"
            value={block.text}
            onFocus={onSelect}
            onChange={(text) => onUpdate({ ...block, text })}
            placeholder="Section heading..."
            className={`${headingFontClass} font-semibold tracking-tight leading-snug ${
              block.level === 2 ? 'text-2xl' : 'text-xl'
            }`}
            style={{ color: design.textColor }}
          />
        </div>
      )}

      {block.type === 'paragraph' && (
        <div>
          {isSelected ? (
            <AutoTextarea
              inputRef={paragraphRef}
              ariaLabel="Paragraph content"
              value={block.text}
              onFocus={onSelect}
              onChange={(text) => onUpdate({ ...block, text })}
              placeholder="Write your paragraph..."
              className={`${bodyFontClass} text-[16px] leading-[1.75] placeholder:text-neutral-300`}
              style={{ color: design.textColor }}
            />
          ) : (
            <p
              className={`${bodyFontClass} text-[16px] leading-[1.75] cursor-text ${
                block.dropCap ? 'editorial-drop-cap' : ''
              }`}
              style={{ color: design.textColor }}
            >
              {block.text.trim() ? (
                <RichInlineText text={block.text} accentColor={design.accentColor} />
              ) : (
                <span className="text-neutral-300">Click to write paragraph...</span>
              )}
            </p>
          )}
        </div>
      )}

      {block.type === 'image' && (
        <div className="space-y-3">
          {showImageSourcePanel && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-800">Studio Library</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8] hover:underline cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STUDIO_IMAGES.map((img) => {
                  const chosen = block.src === img.src;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        onUpdate({
                          ...block,
                          src: img.src,
                          alt: img.defaultAlt,
                          caption: block.caption || img.defaultCaption,
                        });
                      }}
                      className={`text-left rounded overflow-hidden border transition-colors cursor-pointer ${
                        chosen ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="aspect-video bg-neutral-100">
                        <ResilientImage src={img.src} alt={img.label} />
                      </div>
                      <p className="px-2 py-1 text-[11px] text-neutral-700 truncate bg-white">
                        {img.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={block.src}
                    onChange={(e) => onUpdate({ ...block, src: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded text-neutral-900 focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    Alt text (for accessibility)
                  </label>
                  <input
                    type="text"
                    value={block.alt}
                    onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
                    placeholder="Describe what appears in the image..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded text-neutral-900 focus:border-[#1D4ED8]"
                  />
                </div>
              </div>
            </div>
          )}

          <div
            className={`w-full overflow-hidden rounded border ${
              block.aspect === '16:9'
                ? 'aspect-video'
                : block.aspect === '4:3'
                ? 'aspect-[4/3]'
                : ''
            }`}
            style={{ borderColor: design.borderColor }}
          >
            <ResilientImage
              src={block.src}
              alt={block.alt}
              fallbackTitle={block.caption || 'Newsletter visual'}
            />
          </div>

          <input
            type="text"
            aria-label="Image caption"
            value={block.caption}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
            placeholder="Add an editorial figure caption..."
            className="w-full bg-transparent text-xs italic placeholder:text-neutral-300"
            style={{ color: design.mutedColor }}
          />
        </div>
      )}

      {block.type === 'quote' && (
        <div
          className="py-5 px-4 text-center border-y"
          style={{ borderColor: design.borderColor }}
        >
          <AutoTextarea
            ariaLabel="Pull quote text"
            value={block.text}
            onFocus={onSelect}
            onChange={(text) => onUpdate({ ...block, text })}
            placeholder="Enter pull quote..."
            className={`${headingFontClass} text-xl sm:text-2xl italic leading-relaxed text-center placeholder:text-neutral-300`}
            style={{ color: design.textColor }}
          />
          <input
            type="text"
            aria-label="Quote attribution"
            value={block.attribution}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, attribution: e.target.value })}
            placeholder="Attribution or source"
            className="w-full bg-transparent text-xs text-center mt-2 placeholder:text-neutral-300"
            style={{ color: design.mutedColor }}
          />
        </div>
      )}

      {block.type === 'links' && (
        <div className="space-y-3">
          <input
            type="text"
            aria-label="Links section heading"
            value={block.heading}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, heading: e.target.value })}
            placeholder="Curated section heading..."
            className={`w-full bg-transparent ${headingFontClass} text-xl font-semibold tracking-tight placeholder:text-neutral-300`}
            style={{ color: design.textColor }}
          />

          <div className="divide-y" style={{ borderColor: design.borderColor }}>
            {block.items.map((item, itemIdx) => (
              <div
                key={item.id}
                className="py-3 first:pt-2 space-y-1.5"
                style={{ borderColor: design.borderColor }}
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    aria-label={`Link ${itemIdx + 1} title`}
                    value={item.title}
                    onFocus={onSelect}
                    onChange={(e) => {
                      const next = block.items.map((it) =>
                        it.id === item.id ? { ...it, title: e.target.value } : it
                      );
                      onUpdate({ ...block, items: next });
                    }}
                    placeholder="Article or resource title"
                    className="flex-1 bg-transparent text-[15px] font-semibold underline underline-offset-4 decoration-1 placeholder:no-underline placeholder:text-neutral-300"
                    style={{ color: design.accentColor }}
                  />
                  {block.items.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove link item"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({
                          ...block,
                          items: block.items.filter((it) => it.id !== item.id),
                        });
                      }}
                      className="text-neutral-400 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    aria-label={`Link ${itemIdx + 1} URL`}
                    value={item.url}
                    onFocus={onSelect}
                    onChange={(e) => {
                      const next = block.items.map((it) =>
                        it.id === item.id ? { ...it, url: e.target.value } : it
                      );
                      onUpdate({ ...block, items: next });
                    }}
                    placeholder="https://..."
                    className="bg-transparent text-xs font-mono text-neutral-500 border-b border-transparent focus:border-neutral-300 py-0.5"
                  />
                  <input
                    type="text"
                    aria-label={`Link ${itemIdx + 1} source`}
                    value={item.source}
                    onFocus={onSelect}
                    onChange={(e) => {
                      const next = block.items.map((it) =>
                        it.id === item.id ? { ...it, source: e.target.value } : it
                      );
                      onUpdate({ ...block, items: next });
                    }}
                    placeholder="Publication or source"
                    className="bg-transparent text-xs text-neutral-500 border-b border-transparent focus:border-neutral-300 py-0.5"
                  />
                </div>

                <AutoTextarea
                  ariaLabel={`Link ${itemIdx + 1} commentary`}
                  value={item.note}
                  onFocus={onSelect}
                  onChange={(note) => {
                    const next = block.items.map((it) =>
                      it.id === item.id ? { ...it, note } : it
                    );
                    onUpdate({ ...block, items: next });
                  }}
                  placeholder="Write a one-sentence editorial note..."
                  className={`${bodyFontClass} text-sm leading-relaxed placeholder:text-neutral-300`}
                  style={{ color: design.mutedColor }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({
                ...block,
                items: [
                  ...block.items,
                  {
                    id: createId('lnk'),
                    title: 'New Curated Piece',
                    url: 'https://example.com',
                    source: 'Publication',
                    note: 'Short editorial summary explaining why readers should click.',
                  },
                ],
              });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 pt-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add link item</span>
          </button>
        </div>
      )}

      {block.type === 'callout' && (
        <div
          className="p-5 rounded-md border space-y-2"
          style={{
            backgroundColor: design.surfaceColor,
            borderColor: design.borderColor,
          }}
        >
          <input
            type="text"
            aria-label="Callout title"
            value={block.title}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder="Note title..."
            className={`w-full bg-transparent ${headingFontClass} text-base font-semibold placeholder:text-neutral-400`}
            style={{ color: design.textColor }}
          />
          <AutoTextarea
            ariaLabel="Callout body"
            value={block.body}
            onFocus={onSelect}
            onChange={(body) => onUpdate({ ...block, body })}
            placeholder="Write an editor’s note, takeaway, or reader prompt..."
            className={`${bodyFontClass} text-[15px] leading-relaxed placeholder:text-neutral-400`}
            style={{ color: design.mutedColor }}
          />
        </div>
      )}

      {block.type === 'button' && (
        <div className="space-y-3">
          <div className={block.alignment === 'center' ? 'text-center' : 'text-left'}>
            <span
              className="inline-block px-6 py-3 rounded-md text-sm font-semibold transition-colors"
              style={
                block.variant === 'solid'
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
              {block.label || 'Button label'}
            </span>
          </div>
          {isSelected && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100"
            >
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Button label</label>
                <input
                  type="text"
                  value={block.label}
                  onChange={(e) => onUpdate({ ...block, label: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={block.url}
                  onChange={(e) => onUpdate({ ...block, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-neutral-200 rounded text-neutral-900 focus:border-[#1D4ED8]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {block.type === 'metrics' && (
        <div className="space-y-3">
          <input
            type="text"
            aria-label="Metrics section label"
            value={block.heading}
            onFocus={onSelect}
            onChange={(e) => onUpdate({ ...block, heading: e.target.value })}
            placeholder="Metrics heading..."
            className="w-full bg-transparent text-xs uppercase tracking-wider placeholder:normal-case placeholder:text-neutral-300"
            style={{ color: design.mutedColor }}
          />
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y"
            style={{ borderColor: design.borderColor }}
          >
            {block.items.map((item, idx) => (
              <div key={item.id} className="space-y-1">
                <input
                  type="text"
                  aria-label={`Metric ${idx + 1} value`}
                  value={item.value}
                  onFocus={onSelect}
                  onChange={(e) => {
                    const next = block.items.map((m) =>
                      m.id === item.id ? { ...m, value: e.target.value } : m
                    );
                    onUpdate({ ...block, items: next });
                  }}
                  className={`w-full bg-transparent ${headingFontClass} text-2xl font-semibold tabular-nums`}
                  style={{ color: design.textColor }}
                />
                <input
                  type="text"
                  aria-label={`Metric ${idx + 1} label`}
                  value={item.label}
                  onFocus={onSelect}
                  onChange={(e) => {
                    const next = block.items.map((m) =>
                      m.id === item.id ? { ...m, label: e.target.value } : m
                    );
                    onUpdate({ ...block, items: next });
                  }}
                  className="w-full bg-transparent text-xs font-semibold"
                  style={{ color: design.textColor }}
                />
                <input
                  type="text"
                  aria-label={`Metric ${idx + 1} detail`}
                  value={item.detail}
                  onFocus={onSelect}
                  onChange={(e) => {
                    const next = block.items.map((m) =>
                      m.id === item.id ? { ...m, detail: e.target.value } : m
                    );
                    onUpdate({ ...block, items: next });
                  }}
                  placeholder="Context / timeframe"
                  className="w-full bg-transparent text-xs placeholder:text-neutral-300"
                  style={{ color: design.mutedColor }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'divider' && (
        <div className="py-3">
          {block.style === 'hairline' && (
            <div className="h-px w-full" style={{ backgroundColor: design.borderColor }} />
          )}
          {block.style === 'dinkus' && (
            <p
              className="text-center font-serif text-base tracking-[0.6em]"
              style={{ color: design.mutedColor }}
            >
              * * *
            </p>
          )}
          {block.style === 'space' && (
            <div className="h-6 border border-dashed border-neutral-200 rounded flex items-center justify-center">
              <span className="text-[11px] text-neutral-400">Vertical breathing space</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
