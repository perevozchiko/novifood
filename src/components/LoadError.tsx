'use client';

import { useT } from '@/providers/LanguageProvider';

type LoadErrorProps = {
  onRetry: () => void;
};

export default function LoadError({ onRetry }: LoadErrorProps) {
  const { t } = useT();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('common.loadError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
      >
        {t('common.retry')}
      </button>
    </div>
  );
}
