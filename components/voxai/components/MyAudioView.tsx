import {
  Check,
  Download,
  Edit3,
  FileAudio,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  blobToBase64,
  formatBytes,
  formatDuration,
  triggerFileDownload,
} from '../lib/audioUtils';
import type { AudioFormat, GeneratedAudioRecord } from '../types/vox';
import { WaveformPlayer } from './WaveformPlayer';

interface MyAudioViewProps {
  records: GeneratedAudioRecord[];
  defaultDownloadFormat: AudioFormat;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoadIntoStudio: (record: GeneratedAudioRecord) => void;
  onGoToStudio: () => void;
}

export function MyAudioView({
  records,
  defaultDownloadFormat,
  onRename,
  onDelete,
  onLoadIntoStudio,
  onGoToStudio,
}: MyAudioViewProps) {
  const [search, setSearch] = useState('');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(
    records[0]?.id ?? null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.voiceName.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q)
    );
  }, [records, search]);

  const activeRecord = useMemo(
    () => records.find((r) => r.id === activeRecordId) ?? filtered[0] ?? null,
    [records, activeRecordId, filtered]
  );

  const handleQuickDownload = async (record: GeneratedAudioRecord, format: AudioFormat) => {
    setError(null);
    setConvertingId(`${record.id}-${format}`);
    try {
      if (format === 'wav') {
        const safe = record.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'voxai-audio';
        triggerFileDownload(record.blob, `${safe}.wav`);
        return;
      }
      const base64 = await blobToBase64(record.blob);
      const res = await fetch('/api/voxai/tts/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, format: 'mp3' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Could not convert to MP3.');
      }
      const mp3Blob = await res.blob();
      const safe = record.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'voxai-audio';
      triggerFileDownload(mp3Blob, `${safe}.mp3`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Audio
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-[#A1A1AA]">
            Saved locally in your browser using IndexedDB. No account required.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved audio…"
            aria-label="Search saved audio"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#8065F5] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {records.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-12 text-center">
          <FileAudio className="mx-auto h-10 w-10 text-slate-400 dark:text-[#A1A1AA]" />
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
            No generated audio yet
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-[#A1A1AA]">
            Speech you generate in the studio will automatically appear here for replay and export.
          </p>
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-5 rounded-xl bg-[#8065F5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7053eb] transition-colors"
          >
            Go to Text to Speech
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {activeRecord && (
            <WaveformPlayer
              title={activeRecord.title}
              voiceLabel={`${activeRecord.voiceName} · ${activeRecord.language}`}
              audioBlob={activeRecord.blob}
              durationSeconds={activeRecord.durationSeconds}
              defaultDownloadFormat={defaultDownloadFormat}
            />
          )}

          <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24]">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500 dark:text-[#A1A1AA]">
                No audio tracks match “{search}”.
              </p>
            ) : (
              filtered.map((record) => {
                const isSelected = activeRecord?.id === record.id;
                const isEditing = editingId === record.id;
                const dateStr = new Date(record.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={record.id}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 transition-colors ${
                      isSelected ? 'bg-[#8065F5]/5 dark:bg-[#202430]/80' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg border border-[#8065F5] bg-slate-50 dark:bg-[#111318] px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await onRename(record.id, editTitle);
                              setEditingId(null);
                            }}
                            aria-label="Save title"
                            className="rounded-lg bg-[#8065F5] p-1.5 text-white hover:bg-[#7053eb]"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel rename"
                            className="rounded-lg border border-slate-200 dark:border-white/10 p-1.5 text-slate-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white truncate">
                            {record.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(record.id);
                              setEditTitle(record.title);
                            }}
                            aria-label={`Rename ${record.title}`}
                            className="rounded p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#A1A1AA]">
                        <span>{record.voiceName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{record.language}</span>
                        <span aria-hidden="true">·</span>
                        <span>{dateStr}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {formatDuration(record.durationSeconds)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{formatBytes(record.byteLength)}</span>
                      </div>

                      <p className="mt-2 text-xs text-slate-600 dark:text-[#A1A1AA] line-clamp-1">
                        {record.text}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveRecordId(record.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#8065F5] text-white'
                            : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-[#8065F5]'
                        }`}
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>{isSelected ? 'Loaded' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={convertingId !== null}
                        onClick={() => handleQuickDownload(record, 'mp3')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-700 dark:text-white hover:border-[#8065F5] disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{convertingId === `${record.id}-mp3` ? 'MP3…' : 'MP3'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDownload(record, 'wav')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-700 dark:text-white hover:border-[#8065F5]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>WAV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadIntoStudio(record)}
                        className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white"
                      >
                        Load Script
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        aria-label={`Delete ${record.title}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
