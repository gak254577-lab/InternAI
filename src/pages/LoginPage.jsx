import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, authLoading, authError, setAuthError } = useAuth();
  const { navigate } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      await loginWithEmail(email, password);
      navigate('dashboard');
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
      navigate('dashboard');
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Background ambient light physics */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-secondary-fixed opacity-30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-tertiary-fixed opacity-20 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div
          onClick={() => navigate('landing')}
          className="flex items-center justify-center gap-2 mb-8 cursor-pointer"
        >
          <img
            alt="InternAI Logo"
            className="h-9 w-auto object-contain"
            src="/images/internai_logo.svg"
            onError={(e) => {
              e.target.src = '/images/internai_logo.png';
            }}
          />
          <span className="font-headline-sm text-2xl text-primary font-bold tracking-tight">
            InternAI
          </span>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-primary">
              Student Sign In
            </h1>
            <p className="text-xs text-on-surface-variant">
              Access your personalized roadmap, resume audits, and verified internships.
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-rose-600 mt-0.5 flex-shrink-0">
                error
              </span>
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={authLoading || submitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-surface-container-high bg-surface hover:bg-surface-container-low transition-all text-xs font-semibold text-on-surface flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-surface-container-high w-full"></div>
            <span className="bg-surface-container-lowest px-3 text-[10px] font-bold text-outline uppercase tracking-wider absolute">
              Or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu or personal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-on-surface uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#/help-and-resources"
                  className="text-[11px] text-secondary hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading || submitting}
              className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary-container transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Student Portal</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="pt-2 text-center text-xs text-on-surface-variant">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                navigate('register');
              }}
              className="font-bold text-secondary hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="text-xs text-on-surface-variant hover:text-primary font-medium inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Back to InternAI Landing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
