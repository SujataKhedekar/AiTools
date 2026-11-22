import React, { useState } from 'react';
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import {
  COLOR_PALETTES,
  DESIGN_STYLES,
  PRESENTATION_LANGUAGES,
  PRESENTATION_TONES,
  PRESENTATION_TYPES,
} from '../lib/themes';
import type { GenerateDeckParams, Presentation } from '../types/deck';

interface GeneratorViewProps {
  initialPrompt?: string;
  token: string | null;
  onBack: () => void;
  onGenerated: (presentation: Presentation) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  initialPrompt = '',
  token,
  onBack,
  onGenerated,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [title, setTitle] = useState('');
  const [slideCount, setSlideCount] = useState(8);
  const [presentationType, setPresentationType] = useState<string>(PRESENTATION_TYPES[0]);
  const [audience, setAudience] = useState('Seed & Series A Investors');
  const [language, setLanguage] = useState<string>(PRESENTATION_LANGUAGES[0]);
  const [tone, setTone] = useState<string>(PRESENTATION_TONES[0]);
  const [designStyle, setDesignStyle] = useState<string>(DESIGN_STYLES[0]);
  const [colorPalette, setColorPalette] = useState<string>(COLOR_PALETTES[0].id);
  const [instructions, setInstructions] = useState('');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please describe the topic or prompt for your presentation.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const payload: GenerateDeckParams = {
        prompt: prompt.trim(),
        title: title.trim() || undefined,
        slideCount,
        presentationType,
        audience: audience.trim() || 'Executive Decision Makers',
        language,
        tone,
        designStyle,
        colorPalette,
        instructions: instructions.trim() || undefined,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/ai/generate-deck', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate presentation.');
      }

      onGenerated(data.presentation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate presentation.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6 pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
              AI Presentation Generator
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure your topic, structure, audience, and visual theme. DeckAI builds an editable
              16:9 presentation with charts, cards, and imagery.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Presentation Topic or Prompt *
              </label>
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a Series A pitch deck for VoltGrid, an AI battery fleet management SaaS reducing commercial EV charging costs by 34%..."
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Presentation Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Presentation Type
                </label>
                <select
                  value={presentationType}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRESENTATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Number of Slides ({slideCount})
                </label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 mt-2"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>3</span>
                  <span>8</span>
                  <span>15</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Enterprise CTOs, Investors"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRESENTATION_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESENTATION_TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        tone === t
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Design Style
                </label>
                <select
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DESIGN_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Preferred Color Palette
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {COLOR_PALETTES.map((pal) => {
                  const selected = colorPalette === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setColorPalette(pal.id)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        {pal.swatch.map((hex, i) => (
                          <span
                            key={`${pal.id}_${i}`}
                            className="w-4 h-4 rounded-full border border-slate-200"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {pal.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Instructions (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Emphasize Q4 ARR growth, include a competitive landscape slide and 18-month roadmap"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating {slideCount}-Slide Deck...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Presentation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
