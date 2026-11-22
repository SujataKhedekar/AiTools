import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Contrast,
  Eye,
  Layers,
} from 'lucide-react';
import { ColourGraph } from './components/ColourGraph';
import { ConfigPanel } from './components/ConfigPanel';
import { ExportPanel } from './components/ExportPanel';
import { HarmonyContrastPanel } from './components/HarmonyContrastPanel';
import { LivePreview } from './components/LivePreview';
import { SavedPalettesPanel } from './components/SavedPalettesPanel';
import { ShadesPanel } from './components/ShadesPanel';
import { Sidebar } from './components/Sidebar';
import { ToolDirectoryView } from './components/ToolDirectoryView';
import { TopHeader } from './components/TopHeader';
import {
  ColourAdjustments,
  ColourFormat,
  GenerationMode,
  GeneratorSettings,
  PresetColour,
  SHADE_LEVELS,
  SavedPalette,
  ShadeEntry,
  ShadeLevel,
  SidebarSection,
  TypographySettings,
  WorkspaceTab,
} from './types/palette';
import {
  buildShadeEntry,
  generatePaletteScale,
  generateRandomColour,
  hexToOklch,
  oklchToHex,
} from './utils/colorScience';
import { copyToClipboard, generateHexListExport } from './utils/exporters';

const STORAGE_KEY_SAVED = 'aivora_tailwind_saved_palettes_v1';
const STORAGE_KEY_RECENT = 'aivora_tailwind_active_state_v1';

const DEFAULT_BASE_HEX = '#3B82F6';
const DEFAULT_ADJUSTMENTS: ColourAdjustments = {
  temperature: 0,
  saturation: 0,
  brightness: 0,
};

interface PersistedWorkspace {
  baseHex: string;
  colourName: string;
  paletteName: string;
  mode: GenerationMode;
  adjustments: ColourAdjustments;
}

function loadSavedPalettes(): SavedPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadRecentWorkspace(): PersistedWorkspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.baseHex === 'string') {
      return parsed as PersistedWorkspace;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const initial = useMemo(() => loadRecentWorkspace(), []);
  const skipNextRegenRef = useRef(false);

  const [activeSection, setActiveSection] = useState<SidebarSection>(
    'tailwind-shade-generator'
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('shades');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [baseHex, setBaseHex] = useState<string>(
    initial?.baseHex ?? DEFAULT_BASE_HEX
  );
  const [colourName, setColourName] = useState<string>(
    initial?.colourName ?? 'primary'
  );
  const [paletteName, setPaletteName] = useState<string>(
    initial?.paletteName ?? 'Tailwind Blue'
  );
  const [mode, setMode] = useState<GenerationMode>(initial?.mode ?? 'classic');
  const [adjustments, setAdjustments] = useState<ColourAdjustments>(
    initial?.adjustments ?? DEFAULT_ADJUSTMENTS
  );

  const [colourFormat, setColourFormat] = useState<ColourFormat>('hex');
  const [selectedLevel, setSelectedLevel] = useState<ShadeLevel>(500);

  const [typography, setTypography] = useState<TypographySettings>({
    codeFontSize: 'md',
    uppercaseHex: true,
    compactRows: false,
  });

  const [settings, setSettings] = useState<GeneratorSettings>({
    anchorBaseAt500: true,
    gamutClamp: true,
    showContrastBadges: true,
  });

  const [shades, setShades] = useState<ShadeEntry[]>(() =>
    generatePaletteScale({
      baseHex: initial?.baseHex ?? DEFAULT_BASE_HEX,
      mode: initial?.mode ?? 'classic',
      adjustments: initial?.adjustments ?? DEFAULT_ADJUSTMENTS,
      anchorBaseAt500: true,
      gamutClamp: true,
    })
  );

  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() =>
    loadSavedPalettes()
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Regenerate non-locked shades whenever base colour, mode, adjustments, or engine settings change
  useEffect(() => {
    if (skipNextRegenRef.current) {
      skipNextRegenRef.current = false;
      return;
    }
    setShades((prev) =>
      generatePaletteScale({
        baseHex,
        mode,
        adjustments,
        anchorBaseAt500: settings.anchorBaseAt500,
        gamutClamp: settings.gamutClamp,
        existingShades: prev,
      })
    );
  }, [baseHex, mode, adjustments, settings.anchorBaseAt500, settings.gamutClamp]);

  // Persist active workspace state in localStorage
  useEffect(() => {
    try {
      const payload: PersistedWorkspace = {
        baseHex,
        colourName,
        paletteName,
        mode,
        adjustments,
      };
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(payload));
    } catch {
      // Storage quota or restricted context
    }
  }, [baseHex, colourName, paletteName, mode, adjustments]);

  // Persist saved palettes list in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedPalettes));
    } catch {
      // Ignore storage failures
    }
  }, [savedPalettes]);

  const handleCopyText = useCallback(
    async (text: string, label: string) => {
      const ok = await copyToClipboard(text);
      showToast(ok ? `Copied ${label}` : `Unable to copy ${label}`);
    },
    [showToast]
  );

  // Interactive Graph Dragging: Adjusts a single shade's lightness in OKLCH space smoothly
  const handleDragShadeLightness = useCallback(
    (level: ShadeLevel, targetLightness: number) => {
      setShades((prev) =>
        prev.map((entry) => {
          if (entry.level !== level || entry.locked) return entry;
          // Baseline lightness before custom offset
          const baselineL = entry.oklch.l - entry.customLightnessOffset;
          const nextOffset = Math.max(
            -0.38,
            Math.min(0.38, targetLightness - baselineL)
          );
          const nextHex = oklchToHex(
            {
              l: targetLightness,
              c: entry.oklch.c,
              h: entry.oklch.h,
            },
            settings.gamutClamp
          );
          return buildShadeEntry(level, nextHex, {
            locked: false,
            isEdited: true,
            customLightnessOffset: nextOffset,
          });
        })
      );
    },
    [settings.gamutClamp]
  );

  const handleEditShadeHex = useCallback((level: ShadeLevel, hex: string) => {
    setShades((prev) =>
      prev.map((entry) => {
        if (entry.level !== level) return entry;
        const newOklch = hexToOklch(hex);
        const baselineL = entry.oklch.l - entry.customLightnessOffset;
        return buildShadeEntry(level, hex, {
          locked: true, // Lock edited shade so further slider tweaks respect user's manual override until unlocked/reset
          isEdited: true,
          customLightnessOffset: newOklch.l - baselineL,
        });
      })
    );
    setSelectedLevel(level);
  }, []);

  const handleToggleLock = useCallback((level: ShadeLevel) => {
    setShades((prev) =>
      prev.map((entry) =>
        entry.level === level ? { ...entry, locked: !entry.locked } : entry
      )
    );
  }, []);

  const handleResetShade = useCallback(
    (level: ShadeLevel) => {
      const fresh = generatePaletteScale({
        baseHex,
        mode,
        adjustments,
        anchorBaseAt500: settings.anchorBaseAt500,
        gamutClamp: settings.gamutClamp,
      });
      const target = fresh.find((s) => s.level === level);
      if (!target) return;
      setShades((prev) =>
        prev.map((entry) => (entry.level === level ? target : entry))
      );
      showToast(`Reset shade ${level}`);
    },
    [baseHex, mode, adjustments, settings.anchorBaseAt500, settings.gamutClamp, showToast]
  );

  const handleResetAllEdits = useCallback(() => {
    setShades((prev) => {
      const clearedOffsets = prev.map((s) => ({
        ...s,
        locked: s.isEdited ? false : s.locked,
        isEdited: false,
        customLightnessOffset: 0,
      }));
      return generatePaletteScale({
        baseHex,
        mode,
        adjustments,
        anchorBaseAt500: settings.anchorBaseAt500,
        gamutClamp: settings.gamutClamp,
        existingShades: clearedOffsets,
      });
    });
    showToast('Reset curve & manual shade edits');
  }, [baseHex, mode, adjustments, settings.anchorBaseAt500, settings.gamutClamp, showToast]);

  const handleUnlockAll = useCallback(() => {
    setShades((prev) => {
      const unlocked = prev.map((s) => ({ ...s, locked: false }));
      return generatePaletteScale({
        baseHex,
        mode,
        adjustments,
        anchorBaseAt500: settings.anchorBaseAt500,
        gamutClamp: settings.gamutClamp,
        existingShades: unlocked,
      });
    });
    showToast('Unlocked all shades');
  }, [baseHex, mode, adjustments, settings.anchorBaseAt500, settings.gamutClamp, showToast]);

  const handleSelectPreset = useCallback(
    (preset: PresetColour) => {
      setBaseHex(preset.hex);
      setColourName(preset.slug);
      setPaletteName(`Tailwind ${preset.name}`);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setShades((prev) =>
        prev.map((s) => ({
          ...s,
          isEdited: false,
          customLightnessOffset: 0,
        }))
      );
      showToast(`Loaded ${preset.name} preset`);
    },
    [showToast]
  );

  const handleRandomize = useCallback(() => {
    const rand = generateRandomColour();
    setBaseHex(rand.hex);
    setColourName(rand.colourName);
    setPaletteName(rand.paletteName);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setShades((prev) =>
      prev.map((s) => ({
        ...s,
        isEdited: false,
        customLightnessOffset: 0,
      }))
    );
    showToast(`Generated ${rand.paletteName} (${rand.hex})`);
  }, [showToast]);

  const handleSavePalette = useCallback(() => {
    const shadeRecord = {} as Record<ShadeLevel, string>;
    for (const s of shades) {
      shadeRecord[s.level] = s.hex;
    }
    const newEntry: SavedPalette = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      paletteName: paletteName.trim() || 'Untitled Palette',
      colourName: colourName.trim() || 'primary',
      baseHex,
      mode,
      adjustments: { ...adjustments },
      shades: shadeRecord,
      savedAt: new Date().toISOString(),
    };
    setSavedPalettes((prev) => [newEntry, ...prev.slice(0, 29)]);
    showToast(`Saved "${newEntry.paletteName}"`);
  }, [shades, paletteName, colourName, baseHex, mode, adjustments, showToast]);

  const handleLoadSavedPalette = useCallback(
    (palette: SavedPalette) => {
      skipNextRegenRef.current = true;
      setBaseHex(palette.baseHex);
      setColourName(palette.colourName);
      setPaletteName(palette.paletteName);
      setMode(palette.mode);
      setAdjustments(palette.adjustments ?? DEFAULT_ADJUSTMENTS);
      // Restore exact saved shade hexes
      setShades(
        SHADE_LEVELS.map((lvl) =>
          buildShadeEntry(lvl, palette.shades[lvl] ?? palette.baseHex)
        )
      );
      setActiveSection('tailwind-shade-generator');
      showToast(`Loaded "${palette.paletteName}"`);
    },
    [showToast]
  );

  const handleDeleteSavedPalette = useCallback(
    (id: string) => {
      setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
      showToast('Removed palette from library');
    },
    [showToast]
  );

  const handleResetWorkspace = useCallback(() => {
    setBaseHex(DEFAULT_BASE_HEX);
    setColourName('primary');
    setPaletteName('Tailwind Blue');
    setMode('classic');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setSelectedLevel(500);
    setShades(
      generatePaletteScale({
        baseHex: DEFAULT_BASE_HEX,
        mode: 'classic',
        adjustments: DEFAULT_ADJUSTMENTS,
        anchorBaseAt500: settings.anchorBaseAt500,
        gamutClamp: settings.gamutClamp,
      })
    );
    showToast('Workspace reset to #3B82F6');
  }, [settings.anchorBaseAt500, settings.gamutClamp, showToast]);

  const handleCopyFullPalette = useCallback(() => {
    const text = generateHexListExport({
      paletteName,
      colourName,
      baseHex,
      mode,
      shades,
      uppercaseHex: typography.uppercaseHex,
    });
    handleCopyText(text, 'Complete 50–950 Palette');
  }, [paletteName, colourName, baseHex, mode, shades, typography.uppercaseHex, handleCopyText]);

  const hasCustomOffsets = useMemo(
    () => shades.some((s) => s.isEdited || Math.abs(s.customLightnessOffset) > 0.001),
    [shades]
  );

  const WORKSPACE_TABS: {
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'shades', label: 'Shades & Export', icon: Layers },
    { id: 'preview', label: 'Live UI Preview', icon: Eye },
    { id: 'harmony', label: 'Harmonies & Contrast', icon: Contrast },
    { id: 'saved', label: `Saved (${savedPalettes.length})`, icon: Bookmark },
  ];

  return (
    <div className="min-h-screen flex bg-[#F7F6F2] text-[#171614]">
      {/* Fixed Left Aivora Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onJumpToTab={setActiveTab}
        savedPalettes={savedPalettes}
        onLoadPalette={handleLoadSavedPalette}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          title="Tailwind Shade Generator"
          description="Generate professional Tailwind colour scales"
          colourFormat={colourFormat}
          onChangeFormat={setColourFormat}
          typography={typography}
          onChangeTypography={setTypography}
          settings={settings}
          onChangeSettings={setSettings}
          onResetWorkspace={handleResetWorkspace}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto space-y-5">
          {activeSection !== 'tailwind-shade-generator' ? (
            <ToolDirectoryView
              section={activeSection}
              onLaunchShadeGenerator={(tab) => {
                if (tab) setActiveTab(tab);
                setActiveSection('tailwind-shade-generator');
              }}
            />
          ) : (
            <>
              {/* Section 1: Interactive Horizontal Colour Graph (Dominant Visual Anchor) */}
              <ColourGraph
                shades={shades}
                selectedLevel={selectedLevel}
                onSelectLevel={setSelectedLevel}
                onDragShadeLightness={handleDragShadeLightness}
                onCopyText={handleCopyText}
                onResetCurve={handleResetAllEdits}
                onRandomize={handleRandomize}
                onSavePalette={handleSavePalette}
                colourFormat={colourFormat}
                uppercaseHex={typography.uppercaseHex}
                paletteName={paletteName}
                hasCustomOffsets={hasCustomOffsets}
              />

              {/* Section 2 & 3: Configuration Panel (Left) + Generated Shades / Export / Preview / Harmonies (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5 items-start">
                {/* Section 2: Colour Configuration Panel */}
                <ConfigPanel
                  baseHex={baseHex}
                  onChangeBaseHex={setBaseHex}
                  colourName={colourName}
                  onChangeColourName={setColourName}
                  paletteName={paletteName}
                  onChangePaletteName={setPaletteName}
                  mode={mode}
                  onChangeMode={setMode}
                  adjustments={adjustments}
                  onChangeAdjustments={setAdjustments}
                  onSelectPreset={handleSelectPreset}
                  onCopyText={handleCopyText}
                  uppercaseHex={typography.uppercaseHex}
                />

                {/* Section 3: Right Workspace with Segmented View Switcher */}
                <div className="space-y-4 min-w-0">
                  {/* Workspace View Switcher */}
                  <div
                    role="tablist"
                    aria-label="Palette studio sections"
                    className="flex items-center gap-1 p-1 rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-x-auto"
                  >
                    {WORKSPACE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                              : 'text-[#62605A] hover:text-[#171614] hover:bg-[#F5F4F0]'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Panel View */}
                  {activeTab === 'shades' && (
                    <div className="space-y-5">
                      <ShadesPanel
                        shades={shades}
                        selectedLevel={selectedLevel}
                        onSelectLevel={setSelectedLevel}
                        onEditShadeHex={handleEditShadeHex}
                        onToggleLock={handleToggleLock}
                        onResetShade={handleResetShade}
                        onResetAllEdits={handleResetAllEdits}
                        onUnlockAll={handleUnlockAll}
                        onCopyText={handleCopyText}
                        onCopyFullPalette={handleCopyFullPalette}
                        colourFormat={colourFormat}
                        typography={typography}
                        showContrastBadges={settings.showContrastBadges}
                      />

                      <ExportPanel
                        paletteName={paletteName}
                        colourName={colourName}
                        baseHex={baseHex}
                        mode={mode}
                        shades={shades}
                        typography={typography}
                        onCopyText={handleCopyText}
                      />
                    </div>
                  )}

                  {activeTab === 'preview' && (
                    <LivePreview
                      shades={shades}
                      colourName={colourName}
                      paletteName={paletteName}
                    />
                  )}

                  {activeTab === 'harmony' && (
                    <HarmonyContrastPanel
                      baseHex={baseHex}
                      shades={shades}
                      onApplyBaseHex={(hex, label) => {
                        setBaseHex(hex);
                        if (label && label !== 'Base') {
                          setPaletteName(`${paletteName.split(' ')[0]} ${label}`);
                        }
                        showToast(`Applied ${hex} as base colour`);
                      }}
                      onCopyText={handleCopyText}
                      uppercaseHex={typography.uppercaseHex}
                    />
                  )}

                  {activeTab === 'saved' && (
                    <SavedPalettesPanel
                      savedPalettes={savedPalettes}
                      onLoadPalette={handleLoadSavedPalette}
                      onDeletePalette={handleDeleteSavedPalette}
                      onSaveCurrent={handleSavePalette}
                      onCopyText={handleCopyText}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Subtle Toast Confirmation */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#181816] text-xs font-medium text-[#FFFFFF] shadow-lg shadow-black/20"
        >
          <CheckCircle2 className="h-4 w-4 text-[#34D399] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
