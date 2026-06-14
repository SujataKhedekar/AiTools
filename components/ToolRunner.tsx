"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { getApiKey } from "@/lib/apiKey";

export default function ToolRunner({ tool }: { tool: Tool }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const set = (name: string, v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  async function run() {
    setError("");

    const key = getApiKey();
    if (!key) {
      setError("Add your free API key first — click “API key” at the top right.");
      return;
    }

    setOutput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ai-key": key },
        body: JSON.stringify({ slug: tool.slug, inputs: values }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Request failed. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Streaming not supported in this environment.");
        setLoading(false);
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setValues({});
    setOutput("");
    setError("");
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* form */}
      <div className="card h-fit p-5 sm:p-6">
        <p className="eyebrow mb-4">Inputs</p>
        <div className="space-y-4">
          {tool.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-rose-500">*</span>
                )}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  value={values[field.name] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 5}
                  className="field w-full resize-y px-3.5 py-2.5 text-sm"
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.name] ?? field.options?.[0] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="field w-full px-3.5 py-2.5 text-sm"
                >
                  {field.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.name] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="field w-full px-3.5 py-2.5 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="btn-ink inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate
              </>
            )}
          </button>
          <button
            onClick={reset}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-strong)] text-[var(--muted)] transition-colors hover:bg-black/[0.03] hover:text-[var(--ink)]"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        )}
      </div>

      {/* output */}
      <div className="card flex min-h-[22rem] flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Output</p>
          {output && (
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-black/[0.03] hover:text-[var(--ink)]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          )}
        </div>

        {output ? (
          <div className="output-prose flex-1">
            {output}
            {loading && (
              <span className="ml-0.5 inline-block h-4 w-[3px] animate-pulse rounded bg-[var(--accent)] align-middle" />
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--paper)] ring-1 ring-[var(--border)]">
              <Sparkles className="h-5 w-5 text-[var(--faint)]" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-[var(--muted)]">
              {loading ? "Thinking…" : "Your result will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
