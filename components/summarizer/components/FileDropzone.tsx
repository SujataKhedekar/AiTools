import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import type { ExtractedFileResponse } from '../types/summarizer';

interface FileDropzoneProps {
  uploadedFile: { name: string; size: number; wordCount: number } | null;
  onFileExtracted: (data: ExtractedFileResponse) => void;
  onRemoveFile: () => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function FileDropzone({
  uploadedFile,
  onFileExtracted,
  onRemoveFile,
  disabled = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSelectedFile = async (file: File) => {
    setUploadError(null);

    const lowerName = file.name.toLowerCase();
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Unsupported file type. Only PDF, DOCX, TXT, and MD files are allowed.');
      return;
    }

    if (file.size === 0) {
      setUploadError('The selected file is empty.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setUploadError('File exceeds the 10 MB size limit.');
      return;
    }

    setIsUploading(true);
    try {
      const dataBase64 = await readFileAsBase64(file);
      const response = await fetch('/api/summarizer/extract-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          dataBase64,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to extract document text.');
      }

      onFileExtracted(payload as ExtractedFileResponse);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Unable to process file.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#52525B]">
          Upload document <span className="text-[#A1A1AA]">(PDF, DOCX, TXT, MD · max 10 MB)</span>
        </span>
      </div>

      {uploadedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF]/60 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2DDD3] text-[#4F46E5]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#18181B]">
                {uploadedFile.name}
              </p>
              <p className="font-mono text-[11px] tabular-nums text-[#71717A]">
                {formatBytes(uploadedFile.size)} · {uploadedFile.wordCount.toLocaleString()} words extracted
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              onRemoveFile();
            }}
            disabled={disabled || isUploading}
            aria-label="Remove uploaded file"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#71717A] hover:bg-white hover:text-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled || isUploading) return;
            const file = e.dataTransfer.files?.[0];
            if (file) {
              void handleSelectedFile(file);
            }
          }}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-3.5 py-2.5 transition-colors ${
            isDragging
              ? 'border-[#4F46E5] bg-[#EEF2FF]/70'
              : 'border-[#D9D4CA] bg-[#FAF9F6]/70 hover:border-[#B8B1A3]'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs text-[#52525B]">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#4F46E5]" />
            ) : (
              <Upload className="h-4 w-4 text-[#6366F1]" />
            )}
            <span>
              {isUploading
                ? 'Extracting document text...'
                : 'Drag and drop a file here, or browse'}
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            className="sr-only"
            disabled={disabled || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleSelectedFile(file);
              }
            }}
          />

          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-[#E2DDD3] bg-white px-3 py-1.5 text-xs font-medium text-[#18181B] shadow-2xs hover:bg-[#FAF9F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            Browse files
          </button>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-[#DC2626]">
          {uploadError}
        </p>
      )}
    </div>
  );
}
