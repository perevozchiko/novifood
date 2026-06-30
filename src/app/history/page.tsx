'use client';

import { useCallback } from 'react';
import LoadError from '@/components/LoadError';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { getSettingsBrowser } from '@/lib/settings';
import HistoryClient from './HistoryClient';

function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-28" />
        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const fetcher = useCallback(() => getSettingsBrowser(), []);
  const { data: settings, isLoading, error, refetch } = useAuthenticatedQuery('settings', fetcher);

  return (
    <div className="pt-6">
      {error ? (
        <LoadError onRetry={refetch} />
      ) : isLoading || !settings ? (
        <HistorySkeleton />
      ) : (
        <HistoryClient settings={settings} />
      )}
    </div>
  );
}
