'use client';

import { useCallback } from 'react';
import LoadError from '@/components/LoadError';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { getSettingsBrowser } from '@/lib/settings';
import SettingsClient from './SettingsClient';

function SettingsSkeleton() {
  return (
    <div className="space-y-4 pt-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-8" />
          </div>
          <div className="h-9 bg-gray-100 dark:bg-gray-700 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const fetcher = useCallback(() => getSettingsBrowser(), []);
  const { data, isLoading, error, refetch } = useAuthenticatedQuery('settings', fetcher);

  if (error) return <LoadError onRetry={refetch} />;
  return isLoading || !data ? <SettingsSkeleton /> : <SettingsClient settings={data} />;
}
