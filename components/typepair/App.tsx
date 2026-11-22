import { useCallback, useEffect, useState } from 'react';
import { CuratedPairsView } from './components/CuratedPairsView';
import { ExportModal } from './components/ExportModal';
import { Header } from './components/Header';
import { SavedPairsView } from './components/SavedPairsView';
import { SpecimenCanvas } from './components/SpecimenCanvas';
import { TypeScaleView } from './components/TypeScaleView';
import { WorkbenchControls } from './components/WorkbenchControls';
import {
  CURATED_PAIRINGS,
  DEFAULT_PAIRING_STATE,
  FONT_CATALOG,
  SPECIMEN_COPY_PRESETS,
  SPECIMEN_PALETTES,
} from './data/fonts';
import {
  ActiveTab,
  CuratedPairing,
  FontEntry,
  PairingState,
  PreviewTemplate,
  SavedPairing,
  SpecimenCopy,
} from './types/typography';
import { loadGoogleFont } from './utils/fontLoader';

const SAVED_STORAGE_KEY = 'typepair_saved_pairs_v1';
const THEME_STORAGE_KEY = 'typepair_theme_v1';

function pickRandom<T>(items: T[], exclude?: (item: T) => boolean): T {
  const pool = exclude ? items.filter((item) => !exclude(item)) : items;
  const source = pool.length > 0 ? pool : items;
  return source[Math.floor(Math.random() * source.length)];
}

function closestWeight(available: number[], target: number): number {
  return available.reduce((best, curr) =>
    Math.abs(curr - target) < Math.abs(best - target) ? curr : best
  );
}

function readInitialSavedPairs(): SavedPairing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  } catch {
    return false;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workbench');
  const [state, setState] = useState<PairingState>(DEFAULT_PAIRING_STATE);
  const [template, setTemplate] = useState<PreviewTemplate>('editorial');
  const [copy, setCopy] = useState<SpecimenCopy>(SPECIMEN_COPY_PRESETS[0]);
  const [exportOpen, setExportOpen] = useState(false);
  const [savedPairs, setSavedPairs] = useState<SavedPairing[]>(readInitialSavedPairs);
  const [justSaved, setJustSaved] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(readInitialDarkMode);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.querySelector('.typepair-root');
    if (!root) return;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [darkMode]);

  // Persist saved pairs
  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedPairs));
    } catch {
      // Ignore storage errors
    }
  }, [savedPairs]);

  // Dynamically load active pairing Google Fonts
  useEffect(() => {
    loadGoogleFont(state.heading.family);
    loadGoogleFont(state.body.family);
    loadGoogleFont(state.accent.family);
  }, [state.heading.family, state.body.family, state.accent.family]);

  const handleShuffle = useCallback(() => {
    setState((prev) => {
      const headingCandidates = FONT_CATALOG.filter((f) =>
        f.recommendedRole.includes('heading')
      );
      const bodyCandidates = FONT_CATALOG.filter((f) =>
        f.recommendedRole.includes('body')
      );
      const accentCandidates = FONT_CATALOG.filter((f) =>
        f.recommendedRole.includes('accent')
      );

      let nextHeadingFamily = prev.heading.family;
      let nextHeadingWeight = prev.heading.weight;
      let nextBodyFamily = prev.body.family;
      let nextBodyWeight = prev.body.weight;
      let nextAccentFamily = prev.accent.family;
      let nextAccentWeight = prev.accent.weight;

      if (!prev.locked.heading && !prev.locked.body && Math.random() < 0.45) {
        const curated = pickRandom(
          CURATED_PAIRINGS,
          (p) =>
            p.headingFamily === prev.heading.family &&
            p.bodyFamily === prev.body.family
        );
        nextHeadingFamily = curated.headingFamily;
        nextHeadingWeight = curated.headingWeight;
        nextBodyFamily = curated.bodyFamily;
        nextBodyWeight = curated.bodyWeight;
        if (!prev.locked.accent) {
          nextAccentFamily = curated.accentFamily;
          const accEntry = FONT_CATALOG.find((f) => f.family === curated.accentFamily);
          nextAccentWeight = accEntry ? closestWeight(accEntry.weights, 500) : 500;
        }
      } else {
        if (!prev.locked.heading) {
          const picked: FontEntry = pickRandom(
            headingCandidates,
            (f) => f.family === prev.heading.family || f.family === prev.body.family
          );
          nextHeadingFamily = picked.family;
          nextHeadingWeight = closestWeight(picked.weights, 600);
        }

        const headingEntry = FONT_CATALOG.find((f) => f.family === nextHeadingFamily);
        if (!prev.locked.body) {
          // Prefer contrasting classification against heading
          const preferredBody = bodyCandidates.filter((f) => {
            if (f.family === nextHeadingFamily || f.family === prev.body.family) {
              return false;
            }
            if (headingEntry?.category === 'serif' || headingEntry?.category === 'display') {
              return f.category === 'sans';
            }
            return true;
          });
          const pickedBody = pickRandom(
            preferredBody.length > 0 ? preferredBody : bodyCandidates,
            (f) => f.family === prev.body.family || f.family === nextHeadingFamily
          );
          nextBodyFamily = pickedBody.family;
          nextBodyWeight = closestWeight(pickedBody.weights, 400);
        }

        if (!prev.locked.accent) {
          const pickedAccent = pickRandom(accentCandidates);
          nextAccentFamily = pickedAccent.family;
          nextAccentWeight = closestWeight(pickedAccent.weights, 500);
        }
      }

      const headingMeta = FONT_CATALOG.find((f) => f.family === nextHeadingFamily);
      return {
        ...prev,
        heading: {
          ...prev.heading,
          family: nextHeadingFamily,
          weight: nextHeadingWeight,
          italic: headingMeta?.hasItalic ? prev.heading.italic : false,
        },
        body: {
          ...prev.body,
          family: nextBodyFamily,
          weight: nextBodyWeight,
        },
        accent: {
          ...prev.accent,
          family: nextAccentFamily,
          weight: nextAccentWeight,
        },
      };
    });
  }, []);

  // Spacebar shortcut for shuffling unlocked fonts in workbench
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || activeTab !== 'workbench' || exportOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      handleShuffle();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, exportOpen, handleShuffle]);

  function handleSwapFonts() {
    setState((prev) => {
      const oldHeadingEntry = FONT_CATALOG.find((f) => f.family === prev.heading.family);
      const oldBodyEntry = FONT_CATALOG.find((f) => f.family === prev.body.family);
      return {
        ...prev,
        heading: {
          ...prev.heading,
          family: prev.body.family,
          weight: oldBodyEntry
            ? closestWeight(oldBodyEntry.weights, prev.heading.weight)
            : 600,
          italic: oldBodyEntry?.hasItalic ? prev.heading.italic : false,
        },
        body: {
          ...prev.body,
          family: prev.heading.family,
          weight: oldHeadingEntry
            ? closestWeight(oldHeadingEntry.weights, prev.body.weight)
            : 400,
        },
      };
    });
  }

  function handleSaveCurrent() {
    const newEntry: SavedPairing = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${state.heading.family} + ${state.body.family}`,
      savedAt: new Date().toISOString(),
      state: structuredClone(state),
    };
    setSavedPairs((prev) => [newEntry, ...prev]);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1600);
  }

  function buildStateFromCurated(pair: CuratedPairing): PairingState {
    const palette =
      SPECIMEN_PALETTES.find((p) => p.id === pair.paletteId) ??
      SPECIMEN_PALETTES[0];
    const accentEntry = FONT_CATALOG.find((f) => f.family === pair.accentFamily);
    return {
      heading: {
        ...state.heading,
        family: pair.headingFamily,
        weight: pair.headingWeight,
        letterSpacing: pair.headingTracking,
        italic: false,
      },
      body: {
        ...state.body,
        family: pair.bodyFamily,
        weight: pair.bodyWeight,
      },
      accent: {
        family: pair.accentFamily,
        weight: accentEntry ? closestWeight(accentEntry.weights, 500) : 500,
        letterSpacing: 0.02,
      },
      palette: { ...palette },
      locked: { heading: false, body: false, accent: false },
    };
  }

  function handleLoadCurated(pair: CuratedPairing) {
    setState(buildStateFromCurated(pair));
    setActiveTab('workbench');
  }

  function handleSaveCurated(pair: CuratedPairing) {
    const pairState = buildStateFromCurated(pair);
    const newEntry: SavedPairing = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: pair.name,
      savedAt: new Date().toISOString(),
      state: pairState,
    };
    setSavedPairs((prev) => [newEntry, ...prev]);
  }

  function handleOpenSaved(saved: SavedPairing) {
    setState(structuredClone(saved.state));
    setActiveTab('workbench');
  }

  function handleDeleteSaved(id: string) {
    setSavedPairs((prev) => prev.filter((item) => item.id !== id));
  }

  function handleRenameSaved(id: string, name: string) {
    setSavedPairs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  }

  function handleUpdateCopyField(field: keyof SpecimenCopy, value: string) {
    setCopy((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSelectCopyPreset(presetId: string) {
    const preset =
      SPECIMEN_COPY_PRESETS.find((p) => p.id === presetId) ??
      SPECIMEN_COPY_PRESETS[0];
    setCopy({ ...preset });
  }

  function handleResetCopy() {
    const preset =
      SPECIMEN_COPY_PRESETS.find((p) => p.id === copy.id) ??
      SPECIMEN_COPY_PRESETS[0];
    setCopy({ ...preset });
  }

  return (
    <div className="typepair-root min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedPairs.length}
        onOpenExport={() => setExportOpen(true)}
      />

      {activeTab === 'workbench' && (
        <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
          <WorkbenchControls
            state={state}
            onChangeState={setState}
            onShuffle={handleShuffle}
            onSwap={handleSwapFonts}
            onSave={handleSaveCurrent}
            justSaved={justSaved}
          />
          <SpecimenCanvas
            state={state}
            template={template}
            onChangeTemplate={setTemplate}
            copy={copy}
            onUpdateCopyField={handleUpdateCopyField}
            onSelectCopyPreset={handleSelectCopyPreset}
            onResetCopy={handleResetCopy}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          />
        </div>
      )}

      {activeTab === 'curated' && (
        <CuratedPairsView
          onLoadCurated={handleLoadCurated}
          onSaveCurated={handleSaveCurated}
        />
      )}

      {activeTab === 'scale' && <TypeScaleView state={state} />}

      {activeTab === 'saved' && (
        <SavedPairsView
          savedPairs={savedPairs}
          onOpenSaved={handleOpenSaved}
          onDeleteSaved={handleDeleteSaved}
          onRenameSaved={handleRenameSaved}
          onBrowseCurated={() => setActiveTab('curated')}
        />
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        state={state}
      />
    </div>
  );
}
