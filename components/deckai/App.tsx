import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { EditorView } from './components/EditorView';
import { GeneratorView } from './components/GeneratorView';
import { LandingPage } from './components/LandingPage';
import {
  AccountModal,
  AuthModal,
  ExportModal,
  PresentationPreviewModal,
} from './components/Modals';
import { signOutFirebase, subscribeToFirebaseAuth } from './lib/firebase';
import { createBlankSlide } from './lib/templates';
import { DECK_THEMES } from './lib/themes';
import type { Presentation, PresentationTemplate, UserProfile } from './types/deck';

type ViewMode = 'landing' | 'generator' | 'dashboard' | 'editor';

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);

  const [activeDeck, setActiveDeck] = useState<Presentation | null>(null);
  const [generatorInitialPrompt, setGeneratorInitialPrompt] = useState('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [exportDeck, setExportDeck] = useState<Presentation | null>(null);
  const [previewState, setPreviewState] = useState<{
    deck: Presentation;
    slideIndex: number;
  } | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const loadPresentations = useCallback(
    async (token: string) => {
      setLoadingDecks(true);
      try {
        const res = await fetch('/api/presentations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load presentations.');
        setPresentations(data.presentations || []);
      } catch (err: unknown) {
        notify('error', err instanceof Error ? err.message : 'Unable to load presentations.');
      } finally {
        setLoadingDecks(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuth(async (fbUser, idToken) => {
      if (fbUser && idToken) {
        try {
          const res = await fetch('/api/auth/google-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setAuthToken(idToken);
            loadPresentations(idToken);
          }
        } catch {
          // Ignore transient sync errors
        }
      }
    });
    return () => unsubscribe();
  }, [loadPresentations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedDeckId = params.get('deck');
    if (sharedDeckId) {
      fetch(`/api/presentations/${encodeURIComponent(sharedDeckId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.presentation) {
            setPreviewState({ deck: data.presentation, slideIndex: 0 });
          } else if (data.error) {
            notify('error', data.error);
          }
        })
        .catch(() => notify('error', 'Unable to load shared presentation.'));
    }

    const billingStatus = params.get('billing');
    if (billingStatus === 'success') {
      notify('success', 'Subscription plan updated successfully.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [notify]);

  const handleAuthenticated = (authenticatedUser: UserProfile, token: string) => {
    setUser(authenticatedUser);
    setAuthToken(token);
    loadPresentations(token);
    notify('success', `Signed in as ${authenticatedUser.displayName}`);
    if (view === 'landing') {
      setView('dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOutFirebase().catch(() => {});
    setUser(null);
    setAuthToken(null);
    setPresentations([]);
    setAccountModalOpen(false);
    setView('landing');
    notify('success', 'Signed out.');
  };

  const handleUseTemplate = async (tpl: PresentationTemplate) => {
    const baseDeck: Presentation = {
      publicId: `tpl_${Math.random().toString(36).slice(2, 10)}`,
      title: tpl.name,
      subtitle: tpl.description,
      presentationType: tpl.presentationType,
      themeId: tpl.themeId,
      isFavorite: false,
      isPublic: false,
      slides: JSON.parse(JSON.stringify(tpl.slides)),
    };

    if (authToken) {
      try {
        const res = await fetch('/api/presentations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(baseDeck),
        });
        const data = await res.json();
        if (res.ok && data.presentation) {
          setPresentations((prev) => [data.presentation, ...prev]);
          setActiveDeck(data.presentation);
          setView('editor');
          return;
        }
      } catch {
        // Fall through to local editor session
      }
    }

    setActiveDeck(baseDeck);
    setView('editor');
  };

  const handleCreateBlank = async () => {
    const theme = DECK_THEMES[0];
    const blankDeck: Presentation = {
      publicId: `deck_${Math.random().toString(36).slice(2, 10)}`,
      title: 'Untitled Presentation',
      subtitle: '',
      presentationType: 'Business Presentation',
      themeId: theme.id,
      isFavorite: false,
      isPublic: false,
      slides: [
        createBlankSlide(theme, 'title'),
        createBlankSlide(theme, 'content-split'),
      ],
    };

    if (authToken) {
      try {
        const res = await fetch('/api/presentations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(blankDeck),
        });
        const data = await res.json();
        if (res.ok && data.presentation) {
          setPresentations((prev) => [data.presentation, ...prev]);
          setActiveDeck(data.presentation);
          setView('editor');
          return;
        }
      } catch {
        // Fall through
      }
    }

    setActiveDeck(blankDeck);
    setView('editor');
  };

  const handleSavePresentation = async (updated: Presentation) => {
    setActiveDeck(updated);
    if (!authToken) return;

    const exists = presentations.some((p) => p.publicId === updated.publicId);
    if (!exists && updated.publicId.startsWith('draft_')) {
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setPresentations((prev) => [data.presentation, ...prev]);
      setActiveDeck(data.presentation);
      return;
    }

    const res = await fetch(`/api/presentations/${encodeURIComponent(updated.publicId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: updated.title,
        subtitle: updated.subtitle,
        themeId: updated.themeId,
        isFavorite: updated.isFavorite,
        isPublic: updated.isPublic,
        slides: updated.slides,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save changes.');
    setPresentations((prev) =>
      prev.map((p) => (p.publicId === updated.publicId ? data.presentation : p))
    );
  };

  const handleRenamePresentation = async (publicId: string, newTitle: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/presentations/${encodeURIComponent(publicId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rename failed.');
      setPresentations((prev) =>
        prev.map((p) => (p.publicId === publicId ? data.presentation : p))
      );
      notify('success', 'Presentation renamed.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Unable to rename presentation.');
    }
  };

  const handleDuplicatePresentation = async (publicId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/presentations/${encodeURIComponent(publicId)}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed.');
      setPresentations((prev) => [data.presentation, ...prev]);
      notify('success', 'Presentation duplicated.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Unable to duplicate presentation.');
    }
  };

  const handleDeletePresentation = async (publicId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/presentations/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Delete failed.');
      setPresentations((prev) => prev.filter((p) => p.publicId !== publicId));
      notify('success', 'Presentation deleted.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Unable to delete presentation.');
    }
  };

  const handleToggleFavorite = async (publicId: string, current: boolean) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/presentations/${encodeURIComponent(publicId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isFavorite: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      setPresentations((prev) =>
        prev.map((p) => (p.publicId === publicId ? data.presentation : p))
      );
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Unable to update favorite.');
    }
  };

  const handleSelectPlanFromLanding = async (plan: 'free' | 'pro' | 'business') => {
    if (!user || !authToken) {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }
    setAccountModalOpen(true);
    if (plan !== user.plan) {
      notify('success', `Choose "${plan.toUpperCase()}" below to switch your plan.`);
    }
  };

  return (
    <div className="deckai-root min-h-screen">
      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-800'
              : 'bg-red-950 text-white border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {view === 'landing' && (
        <LandingPage
          user={user}
          onStartGenerate={(initialPrompt) => {
            setGeneratorInitialPrompt(initialPrompt);
            setView('generator');
          }}
          onUseTemplate={handleUseTemplate}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onOpenDashboard={() => setView('dashboard')}
          onSelectPlan={handleSelectPlanFromLanding}
        />
      )}

      {view === 'generator' && (
        <GeneratorView
          initialPrompt={generatorInitialPrompt}
          token={authToken}
          onBack={() => setView(user ? 'dashboard' : 'landing')}
          onGenerated={(deck) => {
            if (authToken) {
              setPresentations((prev) => [deck, ...prev]);
              setUser((u) => (u ? { ...u, generationsUsed: u.generationsUsed + 1 } : u));
            }
            setActiveDeck(deck);
            setView('editor');
            notify('success', `Generated "${deck.title}" (${deck.slides.length} slides)`);
          }}
        />
      )}

      {view === 'dashboard' && user && (
        <DashboardView
          user={user}
          presentations={presentations}
          loading={loadingDecks}
          onCreateNew={() => {
            setGeneratorInitialPrompt('');
            setView('generator');
          }}
          onCreateBlank={handleCreateBlank}
          onOpenPresentation={(deck) => {
            setActiveDeck(deck);
            setView('editor');
          }}
          onRenamePresentation={handleRenamePresentation}
          onDuplicatePresentation={handleDuplicatePresentation}
          onDeletePresentation={handleDeletePresentation}
          onToggleFavorite={handleToggleFavorite}
          onExportPresentation={(deck) => setExportDeck(deck)}
          onUseTemplate={handleUseTemplate}
          onOpenAccount={() => setAccountModalOpen(true)}
          onGoHome={() => setView('landing')}
        />
      )}

      {view === 'editor' && activeDeck && (
        <EditorView
          key={activeDeck.publicId}
          presentation={activeDeck}
          token={authToken}
          onBack={() => setView(user ? 'dashboard' : 'landing')}
          onSavePresentation={handleSavePresentation}
          onOpenExport={(deck) => setExportDeck(deck)}
          onOpenPreview={(deck, slideIndex) => setPreviewState({ deck, slideIndex })}
          onRequireAuth={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      {user && authToken && (
        <AccountModal
          isOpen={accountModalOpen}
          user={user}
          token={authToken}
          onClose={() => setAccountModalOpen(false)}
          onUserUpdated={(updated) => setUser(updated)}
          onSignOut={handleSignOut}
        />
      )}

      {exportDeck && (
        <ExportModal
          isOpen={true}
          presentation={exportDeck}
          onClose={() => setExportDeck(null)}
        />
      )}

      {previewState && (
        <PresentationPreviewModal
          isOpen={true}
          presentation={previewState.deck}
          initialSlideIndex={previewState.slideIndex}
          onClose={() => setPreviewState(null)}
        />
      )}
    </div>
  );
}
