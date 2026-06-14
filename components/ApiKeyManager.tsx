"use client";

import { useEffect, useState } from "react";
import { KeyRound, Check, X, ExternalLink, Trash2 } from "lucide-react";
import { getApiKey, setApiKey, KEY_EVENT } from "@/lib/apiKey";

export default function ApiKeyManager() {
  const [open, setOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  // Keep the header indicator in sync with localStorage.
  useEffect(() => {
    const sync = () => setHasKey(Boolean(getApiKey()));
    sync();
    window.addEventListener(KEY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(KEY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function openModal() {
    setDraft(getApiKey());
    setSaved(false);
    setOpen(true);
  }

  function save() {
    setApiKey(draft);
    setSaved(true);
    setTimeout(() => setOpen(false), 600);
  }

  function clear() {
    setApiKey("");
    setDraft("");
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        <KeyRound className="h-4 w-4" />
        <span className="hidden sm:inline">API key</span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${hasKey ? "bg-emerald-400" : "bg-amber-400"}`}
          title={hasKey ? "Key set" : "No key yet"}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound className="h-5 w-5 text-indigo-400" /> Your Groq API key
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-zinc-400">
              The tools run on Groq’s free tier using <em>your</em> key. It’s
              stored only in this browser and never sent to anyone but Groq.
            </p>

            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="gsk_…"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={save}
                disabled={!draft.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" /> Saved
                  </>
                ) : (
                  "Save key"
                )}
              </button>
              <button
                onClick={clear}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-300"
                title="Remove key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200"
            >
              Get a free Groq key <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 text-xs text-zinc-500">
              Free, no credit card — sign in, click “Create API Key”, and paste
              it above.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
