'use client';

/*
  Root error boundary.

  Catches unhandled errors thrown by Server Components in the root segment
  (e.g. failed Supabase queries) and renders a recoverable error UI instead
  of the generic Vercel "A server error occurred" page.

  The layout (ThemeProvider + LanguageProvider) stays mounted, so dark-mode
  styles and i18n still apply inside this component.
*/

import { useEffect } from 'react';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: Props) {
  const { t } = useT();

  useEffect(() => {
    console.error('[RootError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-5xl mb-4">⚠️</p>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {t('error.title')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('error.hint')}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
      >
        {t('error.reload')}
      </button>
    </div>
  );
}
