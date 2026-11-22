import { useCallback, useEffect, useRef, useState } from 'react';
import { createBlankResume, createId } from './data/templates';
import { ActiveAppView, CoverLetterDocument, PageSize, ResumeDocument } from './types/resume';
import {
  loadActiveResumeId,
  loadCoverLetter,
  loadResumes,
  saveActiveResumeId,
  saveCoverLetter,
  saveResumes,
} from './utils/storage';
import TopBar from './components/TopBar';
import MyResumesView from './components/MyResumesView';
import EditorWorkspace from './components/EditorWorkspace';
import AIGeneratorView from './components/AIGeneratorView';
import ATSCheckerView from './components/ATSCheckerView';
import CoverLetterView from './components/CoverLetterView';
import ExportModal from './components/ExportModal';
import ResumePreview from './components/ResumePreview';

const MAX_HISTORY = 50;

export default function App() {
  const [resumes, setResumes] = useState<ResumeDocument[]>(() => loadResumes());
  const [activeResumeId, setActiveResumeId] = useState<string>(() =>
    loadActiveResumeId(loadResumes()),
  );
  const [activeView, setActiveView] = useState<ActiveAppView>('editor');
  const [generatorMode, setGeneratorMode] = useState<'form' | 'upload'>('form');
  const [exportOpen, setExportOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetterDocument>(() => loadCoverLetter());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Undo / Redo history per editing session
  const [undoStack, setUndoStack] = useState<ResumeDocument[]>([]);
  const [redoStack, setRedoStack] = useState<ResumeDocument[]>([]);
  const autosaveTimer = useRef<number | null>(null);

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 3000);
  }, []);

  // Debounced autosave without excessive writes
  useEffect(() => {
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      saveResumes(resumes);
      saveActiveResumeId(activeResumeId);
      setLastSavedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      );
    }, 450);

    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
      }
    };
  }, [resumes, activeResumeId]);

  useEffect(() => {
    saveCoverLetter(coverLetter);
  }, [coverLetter]);

  const updateActiveResume = useCallback(
    (updater: (prev: ResumeDocument) => ResumeDocument) => {
      if (!activeResume) return;
      const snapshot = activeResume;
      const updated: ResumeDocument = {
        ...updater(snapshot),
        updatedAt: new Date().toISOString(),
      };
      setUndoStack((hist) => [...hist.slice(-(MAX_HISTORY - 1)), snapshot]);
      setRedoStack([]);
      setResumes((prevList) =>
        prevList.map((doc) => (doc.id === snapshot.id ? updated : doc)),
      );
    },
    [activeResume],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !activeResume) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((hist) => hist.slice(0, -1));
    setRedoStack((r) => [...r.slice(-(MAX_HISTORY - 1)), activeResume]);
    setResumes((list) => list.map((d) => (d.id === activeResume.id ? previous : d)));
  }, [undoStack, activeResume]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !activeResume) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((hist) => [...hist.slice(-(MAX_HISTORY - 1)), activeResume]);
    setResumes((list) => list.map((d) => (d.id === activeResume.id ? next : d)));
  }, [redoStack, activeResume]);

  const handleCreateBlank = () => {
    const fresh = createBlankResume(`Resume ${resumes.length + 1}`);
    setResumes((prev) => [fresh, ...prev]);
    setActiveResumeId(fresh.id);
    setUndoStack([]);
    setRedoStack([]);
    setActiveView('editor');
    showToast('New blank resume created.');
  };

  const handleDuplicate = (id: string) => {
    const source = resumes.find((r) => r.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: ResumeDocument = {
      ...JSON.parse(JSON.stringify(source)),
      id: createId('res'),
      title: `${source.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setResumes((prev) => [copy, ...prev]);
    setActiveResumeId(copy.id);
    setUndoStack([]);
    setRedoStack([]);
    showToast(`Duplicated "${source.title}".`);
  };

  const handleRename = (id: string, newTitle: string) => {
    setResumes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, title: newTitle, updatedAt: new Date().toISOString() } : r,
      ),
    );
    showToast('Resume renamed.');
  };

  const handleDelete = (id: string) => {
    if (resumes.length <= 1) return;
    const remaining = resumes.filter((r) => r.id !== id);
    setResumes(remaining);
    if (activeResumeId === id && remaining[0]) {
      setActiveResumeId(remaining[0].id);
      setUndoStack([]);
      setRedoStack([]);
    }
    showToast('Resume permanently deleted.');
  };

  const handleResumeGenerated = (generated: ResumeDocument) => {
    setResumes((prev) => [generated, ...prev]);
    setActiveResumeId(generated.id);
    setUndoStack([]);
    setRedoStack([]);
    setActiveView('editor');
    showToast('AI resume ready in the live editor.');
  };

  const handleAddVerifiedSkill = (skill: string) => {
    updateActiveResume((prev) => {
      const exists = prev.skills.technical.some(
        (s) => s.toLowerCase() === skill.toLowerCase(),
      );
      if (exists) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          technical: [...prev.skills.technical, skill],
        },
      };
    });
    showToast(`Added "${skill}" to Technical Skills.`);
  };

  const handleSaveDraftNow = () => {
    saveResumes(resumes);
    saveActiveResumeId(activeResumeId);
    setLastSavedAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    );
    showToast('Draft saved.');
  };

  const handleChangePageSize = (size: PageSize) => {
    updateActiveResume((prev) => ({
      ...prev,
      design: { ...prev.design, pageSize: size },
    }));
  };

  return (
    <div className="resume-builder-root min-h-screen bg-[#0B0E14] text-[#ECEFF4]">
      <TopBar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenExport={() => setExportOpen(true)}
      />

      <main>
        {activeView === 'resumes' && (
          <MyResumesView
            resumes={resumes}
            activeResumeId={activeResume.id}
            onSelectEdit={(id) => {
              setActiveResumeId(id);
              setUndoStack([]);
              setRedoStack([]);
              setActiveView('editor');
            }}
            onCreateBlank={handleCreateBlank}
            onOpenGenerator={(mode) => {
              setGeneratorMode(mode);
              setActiveView('generator');
            }}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}

        {activeView === 'editor' && activeResume && (
          <EditorWorkspace
            resume={activeResume}
            onChange={updateActiveResume}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            lastSavedAt={lastSavedAt}
            onSaveDraft={handleSaveDraftNow}
            onDuplicateResume={() => handleDuplicate(activeResume.id)}
          />
        )}

        {activeView === 'generator' && (
          <AIGeneratorView
            initialMode={generatorMode}
            onResumeReady={handleResumeGenerated}
          />
        )}

        {activeView === 'ats' && activeResume && (
          <ATSCheckerView
            resume={activeResume}
            onAddVerifiedSkill={handleAddVerifiedSkill}
            onOpenEditor={() => setActiveView('editor')}
          />
        )}

        {activeView === 'cover-letter' && activeResume && (
          <CoverLetterView
            resume={activeResume}
            coverLetter={coverLetter}
            onChange={setCoverLetter}
          />
        )}
      </main>

      {/* Dedicated full-scale print target so Print / Save Styled PDF works cleanly from any tab */}
      {activeView !== 'cover-letter' && activeResume && (
        <div className="hidden print:block">
          <ResumePreview
            resume={activeResume}
            scale={1}
            showPageGuides={false}
            printId="resume-print-root"
          />
        </div>
      )}

      {exportOpen && activeResume && (
        <ExportModal
          resume={activeResume}
          onChangePageSize={handleChangePageSize}
          onClose={() => setExportOpen(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-5 right-5 z-50 rounded-lg border border-[#D4A843]/40 bg-[#161B26] px-4 py-2.5 text-xs font-medium text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
