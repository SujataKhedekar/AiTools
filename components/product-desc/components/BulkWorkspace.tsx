import { Download, FileSpreadsheet, Loader2, Play, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { generateBulkBatch } from '../services/apiClient';
import {
  autoInferColumnMapping,
  downloadSampleBulkCsv,
  parseSpreadsheetFile,
  type ColumnMapping,
} from '../services/bulkParser';
import { exportCatalogToCsv, exportCatalogToExcel, exportListingToJson } from '../services/exportEngine';
import { MARKETPLACES, WRITING_STYLES } from '../shared/catalogTaxonomy';
import type { BulkProductRow, GeneratedCatalogListing, ProductInput, TokenUsageSummary } from '../shared/types';

interface BulkWorkspaceProps {
  onUsageUpdate: (usage: TokenUsageSummary) => void;
  onOpenListingInStudio: (listing: GeneratedCatalogListing) => void;
}

const MAPPABLE_FIELDS: Array<{ key: keyof ProductInput; label: string }> = [
  { key: 'sku', label: 'SKU / Product Code' },
  { key: 'productName', label: 'Product Name' },
  { key: 'brandName', label: 'Brand Name' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'materialOrFabric', label: 'Material / Fabric' },
  { key: 'color', label: 'Color' },
  { key: 'sizeOrDimensions', label: 'Size / Dimensions' },
  { key: 'price', label: 'Price' },
  { key: 'features', label: 'Features' },
  { key: 'careLabelProvided', label: 'Care Label' },
  { key: 'rawNotes', label: 'Notes / Raw Description' },
  { key: 'targetKeywords', label: 'Keywords' },
];

export function BulkWorkspace({ onUsageUpdate, onOpenListingInStudio }: BulkWorkspaceProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [bulkResults, setBulkResults] = useState<BulkProductRow[]>([]);
  const [writingStyle, setWritingStyle] = useState<string>('Modern ecommerce');
  const [marketplace, setMarketplace] = useState<string>('shopify');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRow, setSelectedRow] = useState<BulkProductRow | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const parsed = await parseSpreadsheetFile(file);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(autoInferColumnMapping(parsed.headers));
      setBulkResults([]);
      setSelectedRow(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse spreadsheet.');
    }
    e.target.value = '';
  };

  const buildMappedRows = () => {
    return rawRows.map((row, idx) => {
      const getVal = (field: keyof ProductInput) => {
        const col = mapping[field];
        return col ? (row[col] ?? '').trim() : '';
      };
      const sku = getVal('sku') || `SKU-${idx + 1}`;
      const productName = getVal('productName') || `Row ${idx + 1}`;
      return {
        rowIndex: idx,
        sku,
        productName,
        rawInput: {
          sku,
          productName,
          brandName: getVal('brandName'),
          subcategory: getVal('subcategory'),
          materialOrFabric: getVal('materialOrFabric'),
          color: getVal('color'),
          sizeOrDimensions: getVal('sizeOrDimensions'),
          price: getVal('price'),
          features: getVal('features'),
          careLabelProvided: getVal('careLabelProvided'),
          rawNotes: getVal('rawNotes'),
          targetKeywords: getVal('targetKeywords'),
        },
      };
    });
  };

  const handleRunBulk = async () => {
    const mapped = buildMappedRows();
    if (!mapped.length) return;
    setIsProcessing(true);
    setErrorMsg('');
    setProgress({ done: 0, total: mapped.length });

    const initialState: BulkProductRow[] = mapped.map((m) => ({
      rowIndex: m.rowIndex,
      sku: m.sku,
      productName: m.productName,
      rawInput: m.rawInput,
      status: 'pending',
      missingInformation: [],
    }));
    setBulkResults(initialState);

    const chunkSize = 5;
    let processedCount = 0;

    try {
      for (let i = 0; i < mapped.length; i += chunkSize) {
        const slice = mapped.slice(i, i + chunkSize);
        setBulkResults((prev) =>
          prev.map((r) =>
            slice.some((s) => s.rowIndex === r.rowIndex) ? { ...r, status: 'processing' } : r
          )
        );

        const res = await generateBulkBatch({
          rows: slice,
          defaultWritingStyle: writingStyle,
          defaultMarketplace: marketplace,
        });
        onUsageUpdate(res.usage);

        setBulkResults((prev) =>
          prev.map((existing) => {
            const updated = res.results.find((u) => u.rowIndex === existing.rowIndex);
            return updated ?? existing;
          })
        );

        processedCount += slice.length;
        setProgress({ done: processedCount, total: mapped.length });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bulk generation interrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const completedListings = bulkResults
    .map((r) => r.listing)
    .filter((l): l is GeneratedCatalogListing => Boolean(l));

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900">
            Bulk Product Catalog Generator
          </h1>
          <p className="mt-1 text-xs text-zinc-600">
            Upload a CSV or Excel (.xlsx) feed, map source columns, preserve SKUs, flag missing
            specs, and export completed catalogs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadSampleBulkCsv}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Sample CSV</span>
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload CSV / Excel</span>
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {headers.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-900">
                Column Mapping · {rawRows.length} Products Loaded
              </h2>
              <p className="text-xs text-zinc-500">
                Verify how spreadsheet columns map to Aivora catalog fields.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Bulk writing style"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                className="rounded-md border border-zinc-200 px-2.5 py-2 text-xs text-zinc-900"
              >
                {WRITING_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                aria-label="Bulk marketplace"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="rounded-md border border-zinc-200 px-2.5 py-2 text-xs text-zinc-900"
              >
                {MARKETPLACES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRunBulk}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      Processing {progress.done}/{progress.total}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Generate All Listings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {MAPPABLE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-[11px] font-medium text-zinc-600">
                  {field.label}
                </label>
                <select
                  value={mapping[field.key] ?? ''}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field.key]: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900"
                >
                  <option value="">(Not mapped)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {bulkResults.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900">
              Generated Catalog Results ({completedListings.length}/{bulkResults.length} completed)
            </div>

            {completedListings.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportCatalogToCsv(completedListings, 'aivora-bulk-catalog')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportCatalogToExcel(completedListings, 'aivora-bulk-catalog')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
            )}
          </div>

          {progress.total > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-zinc-900 transition-all duration-300"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">SKU</th>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Detected Category</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Missing Fields</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {bulkResults.map((row) => (
                  <tr key={row.rowIndex} className="hover:bg-zinc-50/70">
                    <td className="px-3 py-2.5 font-mono text-zinc-700 whitespace-nowrap">
                      {row.sku}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-zinc-900">{row.productName}</td>
                    <td className="px-3 py-2.5 text-zinc-600">
                      {row.listing
                        ? `${row.listing.categoryLabel} · ${row.listing.subcategory}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.status === 'completed' && (
                        <span className="font-medium text-emerald-700">Completed</span>
                      )}
                      {row.status === 'processing' && (
                        <span className="font-medium text-blue-700">Generating...</span>
                      )}
                      {row.status === 'pending' && <span className="text-zinc-500">Queued</span>}
                      {row.status === 'error' && (
                        <span className="font-medium text-red-700">
                          Error: {row.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 tabular-nums">
                      {row.missingInformation.length > 0
                        ? `${row.missingInformation.length} flagged`
                        : 'None'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {row.listing && (
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenListingInStudio(row.listing!)}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            Open in Studio
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRow?.listing && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">
                    Reviewing <span className="font-mono">{selectedRow.sku}</span> ·{' '}
                    {selectedRow.listing.categoryLabel}
                  </div>
                  <h3 className="mt-1 font-display text-base font-semibold text-zinc-900">
                    {selectedRow.listing.productName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportListingToJson(selectedRow.listing!)}
                    className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRow(null)}
                    className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-700">
                {selectedRow.listing.shortDescription}
              </p>
              {selectedRow.missingInformation.length > 0 && (
                <p className="mt-2 text-xs text-amber-800">
                  Missing info: {selectedRow.missingInformation.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
