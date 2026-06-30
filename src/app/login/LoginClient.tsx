'use client';

/*
  LoginClient — email/password sign-in only.

  New users are created by the administrator in Supabase Dashboard.
  Session is stored in cookies so users stay signed in across reloads.
*/

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase-browser';
import {
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from '@/lib/auth-storage';
import { useT } from '@/providers/LanguageProvider';

export default function LoginClient() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error') === 'auth';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authError ? t('auth.errorGeneric') : null);

  useEffect(() => {
    const savedEmail = loadRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getBrowserClient();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t('auth.errorGeneric'));

      if (rememberMe) {
        saveRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }

      window.location.href = '/';
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.errorGeneric');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">NoviFood</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
            />
            {t('auth.rememberMe')}
          </label>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('auth.loading') : t('auth.login')}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {t('auth.adminOnly')}
          </p>
        </form>
      </div>
    </div>
  );
}
