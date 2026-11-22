import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Loader2,
  Maximize2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { exportToHtmlDeck, exportToPdf, exportToPptx } from '../lib/export-utils';
import { signInWithGoogle } from '../lib/firebase';
import type { Presentation, UserProfile } from '../types/deck';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';

// ==========================================
// AUTHENTICATION MODAL
// ==========================================

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onAuthenticated: (user: UserProfile, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [issuedDemoCode, setIssuedDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setMessage(null);
    setResetRequested(false);
    setIssuedDemoCode(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { idToken } = await signInWithGoogle();
      const res = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google sign-in failed.');
      onAuthenticated(data.user, idToken);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign in failed.');
        onAuthenticated(data.user, data.token);
        onClose();
      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed.');
        onAuthenticated(data.user, data.token);
        onClose();
      } else if (mode === 'forgot') {
        if (!resetRequested) {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to request reset code.');
          setResetRequested(true);
          setIssuedDemoCode(data.demoResetCode || null);
          setMessage(data.message);
        } else {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: resetCode, newPassword: password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Reset failed.');
          setMessage(data.message);
          setMode('login');
          setResetRequested(false);
          setPassword('');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-lg font-bold tracking-tight text-slate-900">
            {mode === 'login'
              ? 'Sign in to DeckAI'
              : mode === 'signup'
                ? 'Create your DeckAI account'
                : 'Reset your password'}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login'
              ? 'Save presentations, customize themes, and export ready-to-present decks.'
              : mode === 'signup'
                ? 'Start generating editable pitch decks and presentations in seconds.'
                : 'Enter your email address to verify and update your password.'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="gsi-material-button mb-4"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Sign in with Google</span>
              </div>
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="mx-3 text-xs text-slate-400">or continue with email</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {message}
            {issuedDemoCode && (
              <div className="mt-1 font-mono font-semibold">
                Verification code: {issuedDemoCode}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {mode === 'forgot' && resetRequested && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                6-digit verification code
              </label>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {(mode !== 'forgot' || resetRequested) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  {mode === 'forgot' ? 'New password (min 8 chars)' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={mode === 'login' ? 1 : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login'
              ? 'Sign In'
              : mode === 'signup'
                ? 'Create Account'
                : resetRequested
                  ? 'Update Password'
                  : 'Send Reset Code'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <>
              New to DeckAI?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ACCOUNT & SUBSCRIPTION MODAL
// ==========================================

interface AccountModalProps {
  isOpen: boolean;
  user: UserProfile;
  token: string;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onSignOut: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  user,
  token,
  onClose,
  onUserUpdated,
  onSignOut,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.displayName);
    setNewPassword('');
    setFeedback(null);
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const limit = user.plan === 'business' ? 1000 : user.plan === 'pro' ? 100 : 10;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      onUserUpdated(data.user);
      setNewPassword('');
      setFeedback('Profile settings saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPlan = async (plan: 'free' | 'pro' | 'business') => {
    setUpgradingPlan(plan);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update subscription.');
      if (data.mode === 'stripe' && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
        setFeedback(`Subscription updated to ${plan.toUpperCase()} plan.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Subscription update failed.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Account & Subscription</h2>
            <div className="text-xs text-slate-500">
              {user.email} · {user.plan.toUpperCase()} Plan
            </div>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {feedback}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">AI Deck Generations Used</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {user.generationsUsed} / {limit}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(100, (user.generationsUsed / limit) * 100)}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {user.authProvider === 'email' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New Password (optional)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Sign out of DeckAI
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Subscription Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { id: 'free', name: 'Free', price: '$0/mo', desc: '10 decks · PDF export' },
                { id: 'pro', name: 'Pro', price: '$19/mo', desc: '100 decks · PPTX + AI Assistant' },
                { id: 'business', name: 'Business', price: '$49/mo', desc: '1,000 decks · Brand kits' },
              ] as const
            ).map((p) => {
              const isCurrent = user.plan === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border ${
                    isCurrent ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900">{p.name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-700">{p.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{p.desc}</p>
                  <button
                    type="button"
                    disabled={isCurrent || upgradingPlan !== null}
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-indigo-100 text-indigo-800 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {upgradingPlan === p.id
                      ? 'Processing...'
                      : isCurrent
                        ? 'Current Plan'
                        : 'Switch Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EXPORT MODAL (PPTX, PDF, INTERACTIVE HTML)
// ==========================================

interface ExportModalProps {
  isOpen: boolean;
  presentation: Presentation;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, presentation, onClose }) => {
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    presentation.slides.map((s) => s.id)
  );
  const [exportingFormat, setExportingFormat] = useState<'pptx' | 'pdf' | 'html' | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const offscreenSlideRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(presentation.slides.map((s) => s.id));
      setError(null);
      setSuccessMsg(null);
      setProgress('');
    }
  }, [isOpen, presentation.slides]);

  if (!isOpen) return null;

  const targetSlides =
    scope === 'all'
      ? presentation.slides
      : presentation.slides.filter((s) => selectedIds.includes(s.id));

  const toggleSlide = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportPptx = async () => {
    if (targetSlides.length === 0) {
      setError('Select at least one slide to export.');
      return;
    }
    setExportingFormat('pptx');
    setError(null);
    setSuccessMsg(null);
    try {
      await exportToPptx(presentation.title, targetSlides, (curr, total) => {
        setProgress(`Building slide ${curr} of ${total}...`);
      });
      setSuccessMsg(
        `Downloaded ${targetSlides.length} editable slide(s) as PowerPoint (.pptx). You can also upload this .pptx directly to Google Slides.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PowerPoint export failed.');
    } finally {
      setExportingFormat(null);
      setProgress('');
    }
  };

  const handleExportPdf = async () => {
    if (targetSlides.length === 0) {
      setError('Select at least one slide to export.');
      return;
    }
    setExportingFormat('pdf');
    setError(null);
    setSuccessMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const nodes = targetSlides
        .map((s) => offscreenSlideRefs.current[s.id])
        .filter((el): el is HTMLDivElement => el !== null);
      await exportToPdf(presentation.title, nodes, (curr, total) => {
        setProgress(`Rendering high-res slide ${curr} of ${total}...`);
      });
      setSuccessMsg(`Downloaded ${targetSlides.length} slide(s) as high-resolution PDF.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PDF export failed.');
    } finally {
      setExportingFormat(null);
      setProgress('');
    }
  };

  const handleExportHtml = () => {
    if (targetSlides.length === 0) {
      setError('Select at least one slide to export.');
      return;
    }
    setExportingFormat('html');
    setError(null);
    try {
      exportToHtmlDeck(presentation.title, targetSlides);
      setSuccessMsg(`Downloaded interactive HTML deck (${targetSlides.length} slides).`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'HTML export failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      {/* Offscreen 1280x720 stage for high-resolution PDF capture */}
      <div
        aria-hidden="true"
        className="fixed -left-[99999px] top-0 pointer-events-none opacity-100"
      >
        {presentation.slides.map((slide) => (
          <div
            key={`export_dom_${slide.id}`}
            ref={(el) => {
              offscreenSlideRefs.current[slide.id] = el;
            }}
            style={{ width: '1280px', height: '720px' }}
          >
            <SlideCanvasRenderer slide={slide} fixedScale={1} />
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Export Presentation</h2>
          <p className="text-xs text-slate-500 mt-1">
            {presentation.title} · {presentation.slides.length} slides (16:9 widescreen)
          </p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-3">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                scope === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Export all slides ({presentation.slides.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('selected')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                scope === 'selected'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Export selected slides ({selectedIds.length})
            </button>
          </div>

          {scope === 'selected' && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {presentation.slides.map((slide, idx) => {
                const checked = selectedIds.includes(slide.id);
                return (
                  <label
                    key={slide.id}
                    className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSlide(slide.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono text-slate-400 w-5">{idx + 1}.</span>
                    <span className="text-slate-800 font-medium truncate">{slide.title}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleExportPptx}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">PowerPoint (.pptx)</div>
                <div className="text-xs text-slate-500">
                  Editable slides, shapes, images, and native PowerPoint charts
                </div>
              </div>
            </div>
            {exportingFormat === 'pptx' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleExportPdf}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">High-Resolution PDF (.pdf)</div>
                <div className="text-xs text-slate-500">
                  Print-ready 16:9 pages preserving fonts, charts, and layouts
                </div>
              </div>
            </div>
            {exportingFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleExportHtml}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Interactive Web Deck (.html)</div>
                <div className="text-xs text-slate-500">
                  Self-contained offline slideshow playable in any browser
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {progress && (
          <div className="mt-4 text-xs text-center font-medium text-indigo-700">{progress}</div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// FULLSCREEN PRESENTATION PREVIEW MODAL
// ==========================================

interface PresentationPreviewModalProps {
  isOpen: boolean;
  presentation: Presentation;
  initialSlideIndex?: number;
  onClose: () => void;
}

export const PresentationPreviewModal: React.FC<PresentationPreviewModalProps> = ({
  isOpen,
  presentation,
  initialSlideIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialSlideIndex);

  useEffect(() => {
    setIndex(initialSlideIndex);
  }, [initialSlideIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setIndex((i) => Math.min(presentation.slides.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, presentation.slides.length]);

  if (!isOpen || presentation.slides.length === 0) return null;

  const currentSlide = presentation.slides[Math.min(index, presentation.slides.length - 1)];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl flex items-center justify-between text-slate-300 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Maximize2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-sm font-medium truncate">{presentation.title}</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
        >
          Exit Preview (Esc)
        </button>
      </div>

      <div className="w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl border border-slate-800">
        <SlideCanvasRenderer slide={currentSlide} />
      </div>

      <div className="mt-5 flex items-center gap-4 text-white">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-mono tabular-nums text-slate-300">
          {index + 1} / {presentation.slides.length}
        </span>
        <button
          type="button"
          disabled={index >= presentation.slides.length - 1}
          onClick={() => setIndex((i) => Math.min(presentation.slides.length - 1, i + 1))}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
