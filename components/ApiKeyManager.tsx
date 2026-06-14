"use client";

import { useEffect, useState } from "react";
import { KeyRound, Check, X, ExternalLink, Trash2 } from "lucide-react";
import { getApiKey, setApiKey, KEY_EVENT } from "@/lib/apiKey";

export default function ApiKeyManager() {
  const [open, setOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

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
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-black/[0.03]"
      >
        <KeyRound className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
        <span className="hidden sm:inline">API key</span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${hasKey ? "bg-emerald-500" : "bg-amber-500"}`}
          title={hasKey ? "Key set" : "No key yet"}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--ink)]/30 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-xl font-semibold">
                <KeyRound className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
                Your Groq API key
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              The tools run on Groq’s free tier using <em>your</em> key. It’s
              stored only in this browser and never sent anywhere but Groq.
            </p>

            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="gsk_…"
              autoFocus
              className="field w-full px-3.5 py-2.5 text-sm"
            />

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={save}
                disabled={!draft.trim()}
                className="btn-ink inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
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
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-strong)] text-[var(--muted)] transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Remove key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              Get a free Groq key <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="mt-1.5 text-xs text-[var(--faint)]">
              Free, no credit card — sign in, click “Create API Key”, paste it
              above.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
