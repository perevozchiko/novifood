'use client';

/*
  Offline fallback page.

  The service worker (public/sw.js) returns this page for navigation
  requests when the network is unavailable.

  Kept as a static page with no data fetching so it is always cached.
*/

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="text-5xl mb-4">📡</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Нет подключения
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        Приложение работает в офлайн-режиме. Проверьте интернет и обновите страницу.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-green-600 text-white rounded-2xl px-6 py-3 text-sm font-medium hover:bg-green-700 transition-colors"
      >
        Обновить
      </button>
    </div>
  );
}
