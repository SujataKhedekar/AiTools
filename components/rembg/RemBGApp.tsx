"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, LoaderCircle, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { removeBackground } from "@imgly/background-removal";
import "./rembg.css";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function RemBGApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [sourceUrl, resultUrl]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    setError(""); setStatus(""); setProgress(0);
    if (!ACCEPTED.has(next.type)) { setError("Choose a PNG, JPG, or WebP image."); return; }
    if (next.size > MAX_FILE_SIZE) { setError("Image must be 20 MB or smaller."); return; }
    setFile(next);
    setSourceUrl(URL.createObjectURL(next));
    setResultUrl("");
  }

  async function processImage() {
    if (!file || busy) return;
    setBusy(true); setError(""); setProgress(0); setStatus("Starting the image model…");
    try {
      const blob = await removeBackground(file, {
        model: "isnet_quint8",
        output: { format: "image/png", quality: 1 },
        progress: (key, current, total) => {
          const percentage = total > 0 ? Math.min(99, Math.round(current / total * 100)) : 5;
          setProgress(percentage);
          setStatus(key.startsWith("fetch") ? `Downloading model · ${percentage}%` : `Separating subject · ${percentage}%`);
        },
      });
      setResultUrl(URL.createObjectURL(blob)); setProgress(100); setStatus("Cutout ready");
    } catch (cause) {
      console.error("RemBG image processing failed", cause);
      setError("Could not remove this background. Check your connection for the first model download, then retry.");
      setStatus("");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f6f5f1] px-4 pb-16 text-[#20211f] sm:px-7">
    <div className="mx-auto max-w-6xl pt-10 sm:pt-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#deded7] bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex items-center gap-2 font-semibold tracking-tight">Aivora <span className="text-[#91ab39]">/</span> RemBG</div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f8e7] px-3 py-1.5 text-xs font-medium text-[#667c21]"><ShieldCheck className="h-4 w-4"/> Processed in your browser</span>
      </div>
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#819144]">AI image tool</p><h1 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">Lose the<br className="hidden sm:block"/> background.</h1></div>
        <p className="max-w-sm text-sm leading-6 text-[#777871]">Drop in a photo and get a clean transparent PNG. Your image stays on this device while the model runs in your browser.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-[#deded7] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eeeee9] px-5 py-4 text-[11px] font-semibold uppercase tracking-[.12em] text-[#777871]"><span>01 / Original</span><span className="max-w-[55%] truncate normal-case tracking-normal">{file?.name || "No image selected"}</span></div>
          <div className="grid h-72 place-items-center bg-[#fafaf8] p-4 sm:h-[340px]">{sourceUrl ? <img src={sourceUrl} alt="Original uploaded image" className="max-h-full max-w-full object-contain"/> : <div className="text-center text-sm text-[#8c8d85]"><ImagePlus className="mx-auto mb-3 h-8 w-8"/><b className="block text-[#40413d]">Your photo goes here</b><span>Choose a photo or drop it below.</span></div>}</div>
          <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }} className={`mx-4 mb-4 flex min-h-24 w-[calc(100%-2rem)] flex-col items-center justify-center rounded-xl border border-dashed px-4 py-4 text-sm transition ${dragging ? "border-[#819144] bg-[#f4f8e7]" : "border-[#c9c9c1] bg-[#fafaf8] hover:border-[#91ab39]"}`}><Upload className="mb-2 h-5 w-5 text-[#718d20]"/><span><b>Drop your photo here</b> or <span className="text-[#718d20] underline">browse</span></span><span className="mt-1 text-xs text-[#777871]">JPG, PNG, WebP · up to 20 MB</span></button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])}/>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#deded7] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eeeee9] px-5 py-4 text-[11px] font-semibold uppercase tracking-[.12em] text-[#777871]"><span>02 / Cutout</span><span>Transparent PNG</span></div>
          <div className="checkerboard grid h-72 place-items-center p-4 sm:h-[340px]">{resultUrl ? <img src={resultUrl} alt="Background removed cutout" className="max-h-full max-w-full object-contain"/> : <div className="text-center text-sm text-[#8c8d85]"><Sparkles className="mx-auto mb-3 h-8 w-8"/><b className="block text-[#40413d]">Your cutout will appear here</b><span>The image model separates your subject.</span></div>}</div>
          <div className="flex min-h-[76px] flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <button type="button" onClick={processImage} disabled={!file || busy} className="inline-flex items-center gap-2 rounded-lg bg-[#20211f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#41433b] disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}{busy ? "Removing background…" : "Remove background"}</button>
            {resultUrl && <a href={resultUrl} download="aivora-cutout.png" className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] px-4 py-3 text-sm font-semibold hover:bg-[#fafaf8]"><Download className="h-4 w-4"/>Download PNG</a>}
            {(busy || status) && <span className="text-xs text-[#777871]">{status}{busy && <span className="ml-2">{progress}%</span>}</span>}
          </div>
          {busy && <div className="h-1 bg-[#eef0e6]"><div className="h-full bg-[#91ab39] transition-[width]" style={{ width: `${progress}%` }}/></div>}
        </div>
      </section>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <p className="mt-5 text-xs leading-5 text-[#85867e]">Runs locally in your browser using a pretrained ISNet segmentation model. The model downloads on first use; an internet connection is needed for that initial download.</p>
    </div>
  </main>;
}
