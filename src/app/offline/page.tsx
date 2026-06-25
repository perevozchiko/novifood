'use client';

/*
  Offline fallback page.

  The service worker (public/sw.js) returns this page for navigation
  requests when the network is unavailable.

  Uses useT() for locale-aware text — the page is inside the app layout
  so ThemeProvider and LanguageProvider are available.
*/

import { useT } from '@/providers/LanguageProvider';

export default function OfflinePage() {
  const { t } = useT();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="text-5xl mb-4">📡</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('offline.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        {t('offline.hint')}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-green-600 text-white rounded-2xl px-6 py-3 text-sm font-medium hover:bg-green-700 transition-colors"
      >
        {t('offline.refresh')}
      </button>
    </div>
  );
}
