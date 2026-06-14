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
      setError(
        "Add your free Gemini API key first — click “API key” at the top right.",
      );
      return;
    }

    setOutput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": key,
        },
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* form */}
      <div className="glass rounded-2xl p-5">
        <div className="space-y-4">
          {tool.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                {field.label}
                {field.required && <span className="ml-1 text-rose-400">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  value={values[field.name] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 5}
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.name] ?? field.options?.[0] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {field.options?.map((o) => (
                    <option key={o} value={o} className="bg-zinc-900">
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
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/20">
            {error}
          </p>
        )}
      </div>

      {/* output */}
      <div className="glass relative flex min-h-[20rem] flex-col rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Output</span>
          {output && (
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
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
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-indigo-400 align-middle" />
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-600">
            <Sparkles className="mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">
              {loading ? "Thinking…" : "Your result will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
