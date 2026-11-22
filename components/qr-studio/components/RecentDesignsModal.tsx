import React, { useEffect, useState } from 'react';
import { Copy, Plus, Search, Trash2, X } from 'lucide-react';
import { QRDesignRecord } from '../types/qr';
import { buildQRPayload, getQRTypeLabel } from '../utils/qrPayload';
import { renderQRToSVG } from '../utils/qrRenderer';

interface RecentDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  designs: QRDesignRecord[];
  activeDesignId: string | null;
  onLoadDesign: (design: QRDesignRecord) => void;
  onDuplicateDesign: (design: QRDesignRecord) => void;
  onDeleteDesign: (id: string) => void;
  onSaveCurrent: () => void;
}

const MiniDesignPreview: React.FC<{ design: QRDesignRecord }> = ({ design }) => {
  const payload = buildQRPayload(design.contentType, design.content);
  const rendered = renderQRToSVG(payload, design.style, {
    includeFrame: false,
    baseSize: 160,
  });
  return (
    <div
      className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: rendered.svgMarkup }}
    />
  );
};

export const RecentDesignsModal: React.FC<RecentDesignsModalProps> = ({
  isOpen,
  onClose,
  designs,
  activeDesignId,
  onLoadDesign,
  onDuplicateDesign,
  onDeleteDesign,
  onSaveCurrent,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = designs.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      getQRTypeLabel(d.contentType).toLowerCase().includes(q)
    );
  });

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ts));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recent-drawer-title"
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="recent-drawer-title" className="font-display text-base font-bold text-slate-900">
              Recent QR Designs
            </h2>
            <p className="text-xs text-slate-500">
              Saved locally in your browser · {designs.length} items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recent designs"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Save Current */}
        <div className="border-b border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved designs..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onSaveCurrent}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Current</span>
            </button>
          </div>
        </div>

        {/* Saved List */}
        <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-sm font-semibold text-slate-800">
                {designs.length === 0 ? 'No saved designs yet' : 'No matching designs'}
              </p>
              <p className="mt-1 max-w-[240px] text-xs text-slate-500">
                {designs.length === 0
                  ? 'Save your current QR code to revisit, duplicate, or export it later.'
                  : 'Try adjusting your search query.'}
              </p>
              {designs.length === 0 && (
                <button
                  type="button"
                  onClick={onSaveCurrent}
                  className="mt-4 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Save Current Design</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((design) => {
              const isCurrent = design.id === activeDesignId;
              return (
                <div
                  key={design.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLoadDesign(design);
                      onClose();
                    }}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                  >
                    <MiniDesignPreview design={design} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xs font-semibold text-slate-900">
                        {design.title || 'Untitled QR Design'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{getQRTypeLabel(design.contentType)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDate(design.updatedAt)}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateDesign(design)}
                      title="Duplicate design"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDesign(design.id)}
                      title="Delete design"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
