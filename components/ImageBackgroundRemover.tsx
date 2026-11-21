"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Trash2, WandSparkles, X } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export default function ImageBackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); }, [sourceUrl, resultUrl]);

  function choose(next: File | undefined) {
    if (!next) return;
    setError(""); setResultUrl("");
    if (!ACCEPTED.includes(next.type)) { setError("Choose a PNG, JPEG or WebP image."); return; }
    if (next.size > MAX_BYTES) { setError("Images must be smaller than 10 MB."); return; }
    setFile(next); setSourceUrl(URL.createObjectURL(next));
  }

  async function removeBackground() {
    if (!file) return;
    setLoading(true); setError(""); setResultUrl("");
    try {
      const body = new FormData(); body.append("image", file);
      const response = await fetch("/api/remove-image-background", { method: "POST", body });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Could not remove the background."); }
      const blob = await response.blob();
      if (blob.type !== "image/png") throw new Error("The provider returned an unexpected image format.");
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reach the image service."); }
    finally { setLoading(false); }
  }

  function reset() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setSourceUrl(""); setResultUrl(""); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <section className="card p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><WandSparkles className="h-5 w-5"/></span><div><h2 className="text-lg font-semibold">Make your subject stand out</h2><p className="mt-1 text-sm text-[var(--muted)]">Upload a photo and get a transparent PNG with the background removed.</p></div></div>
      {!file ? <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }} className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--paper)] px-5 text-center transition hover:border-[var(--accent)] hover:bg-emerald-50/30">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm"><ImagePlus className="h-5 w-5 text-[var(--accent)]"/></span><span className="text-sm font-semibold">Drop an image here or browse files</span><span className="mt-1 text-xs text-[var(--muted)]">PNG, JPEG or WebP · Up to 10 MB</span>
      </button> : <div className="grid gap-5 md:grid-cols-2"><div className="overflow-hidden rounded-2xl border border-[var(--border)]"><div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3"><div><p className="text-sm font-medium">Original</p><p className="max-w-64 truncate text-xs text-[var(--muted)]">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={reset} className="rounded-lg p-2 text-[var(--muted)] hover:bg-rose-50 hover:text-rose-700" aria-label="Remove image"><Trash2 className="h-4 w-4"/></button></div><img src={sourceUrl} alt="Uploaded original" className="h-72 w-full bg-white object-contain p-3"/></div><div className="overflow-hidden rounded-2xl border border-[var(--border)]"><div className="border-b border-[var(--border)] px-4 py-3"><p className="text-sm font-medium">Transparent result</p><p className="text-xs text-[var(--muted)]">PNG with alpha transparency</p></div><div className="flex h-72 items-center justify-center bg-[linear-gradient(45deg,#f4f3ef_25%,transparent_25%),linear-gradient(-45deg,#f4f3ef_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f3ef_75%),linear-gradient(-45deg,transparent_75%,#f4f3ef_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">{resultUrl ? <img src={resultUrl} alt="Background removed with transparent background" className="max-h-full max-w-full object-contain p-3"/> : <div className="px-6 text-center text-sm text-[var(--muted)]">{loading ? "Removing background…" : "Your transparent image will appear here."}</div>}</div></div></div>}
      <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => choose(e.target.files?.[0])}/>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">{file && !resultUrl && <button type="button" disabled={loading} onClick={() => void removeBackground()} className="btn-ink inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Removing background…</> : <><WandSparkles className="h-4 w-4"/>Remove background</>}</button>}{resultUrl && <a href={resultUrl} download="background-removed.png" className="btn-ink inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"><Download className="h-4 w-4"/>Download transparent PNG</a>}{file && <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm font-medium"><X className="h-4 w-4"/>Start over</button>}</div>
      <p className="mt-4 text-xs leading-5 text-[var(--faint)]">Images are sent securely to the configured remove.bg service for processing. Provider usage limits or credits may apply.</p>
    </section>
    <section className="grid gap-4 sm:grid-cols-3"><div className="card p-4"><p className="text-sm font-semibold">1. Upload</p><p className="mt-1 text-sm text-[var(--muted)]">Choose a PNG, JPEG or WebP file.</p></div><div className="card p-4"><p className="text-sm font-semibold">2. Process</p><p className="mt-1 text-sm text-[var(--muted)]">The server securely calls the background removal API.</p></div><div className="card p-4"><p className="text-sm font-semibold">3. Download</p><p className="mt-1 text-sm text-[var(--muted)]">Save the cutout as a transparent PNG.</p></div></section>
  </div>;
}
