'use client';

/*
  Auto-banner shown when a new build is waiting. Tapping "Update" reloads into it.
*/

import { usePwaUpdate } from '@/providers/PwaUpdateProvider';
import { useT } from '@/providers/LanguageProvider';

export default function UpdatePrompt() {
  const { t } = useT();
  const { needRefresh, applyUpdate, dismiss } = usePwaUpdate();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg rounded-xl px-4 py-2.5 text-sm"
      role="status"
    >
      <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">{t('update.available')}</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
      >
        {t('update.now')}
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs px-1 transition-colors"
      >
        {t('update.later')}
      </button>
    </div>
  );
}
