import { Download, FileSpreadsheet, FileText, FileType2, X } from 'lucide-react';
import { useState } from 'react';
import {
  exportCatalogToCsv,
  exportCatalogToExcel,
  exportListingToDocx,
  exportListingToJson,
  exportListingToPdf,
  exportListingToTxt,
} from '../services/exportEngine';
import type { GeneratedCatalogListing } from '../shared/types';

interface ExportModalProps {
  listing: GeneratedCatalogListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ listing, isOpen, onClose }: ExportModalProps) {
  const [busyFormat, setBusyFormat] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen || !listing) return null;

  const handleExport = async (format: 'txt' | 'docx' | 'pdf' | 'csv' | 'xlsx' | 'json') => {
    setBusyFormat(format);
    setStatusMessage('');
    try {
      if (format === 'txt') exportListingToTxt(listing);
      else if (format === 'json') exportListingToJson(listing);
      else if (format === 'csv') exportCatalogToCsv([listing]);
      else if (format === 'pdf') exportListingToPdf(listing);
      else if (format === 'docx') await exportListingToDocx(listing);
      else if (format === 'xlsx') await exportCatalogToExcel([listing]);
      setStatusMessage(`Downloaded ${format.toUpperCase()} package for ${listing.sku}.`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusyFormat(null);
    }
  };

  const options = [
    {
      id: 'docx' as const,
      title: 'Word Document (.docx)',
      desc: 'Formatted editorial brief, spec tables, wash care, and SEO fields.',
      icon: FileText,
    },
    {
      id: 'pdf' as const,
      title: 'PDF Spec Sheet (.pdf)',
      desc: 'Print-ready catalog summary with verification disclosures.',
      icon: FileType2,
    },
    {
      id: 'xlsx' as const,
      title: 'Excel Workbook (.xlsx)',
      desc: 'Multi-sheet catalog, attributes, and SEO metadata workbook.',
      icon: FileSpreadsheet,
    },
    {
      id: 'csv' as const,
      title: 'Catalog CSV (.csv)',
      desc: 'UTF-8 spreadsheet feed for Shopify, WooCommerce, or ERP import.',
      icon: Download,
    },
    {
      id: 'txt' as const,
      title: 'Plain Text (.txt)',
      desc: 'Clean copywriter handoff file for email or CMS pasting.',
      icon: FileText,
    },
    {
      id: 'json' as const,
      title: 'Structured JSON (.json)',
      desc: 'Complete machine-readable schema for custom storefronts.',
      icon: Download,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <h2 id="export-modal-title" className="font-display text-lg font-semibold text-zinc-900">
              Export Catalog Package
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {listing.productName} · <span className="font-mono">{listing.sku}</span> ·{' '}
              {listing.categoryLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isBusy = busyFormat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={busyFormat !== null}
                onClick={() => handleExport(opt.id)}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {isBusy ? 'Preparing file...' : opt.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-500">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
