'use client';

import { useCallback } from 'react';
import LoadError from '@/components/LoadError';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { fetchWeekStats } from '@/lib/week-stats';
import StatsClient from './StatsClient';

function StatsSkeleton() {
  return (
    <div className="space-y-4 pt-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-56" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="h-28 bg-gray-100 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const fetcher = useCallback(() => fetchWeekStats(), []);
  const { data, isLoading, error, refetch } = useAuthenticatedQuery('stats:week', fetcher);

  if (error) return <LoadError onRetry={refetch} />;
  return isLoading || !data ? (
    <StatsSkeleton />
  ) : (
    <StatsClient weekStats={data.weekStats} settings={data.settings} streak={data.streak} />
  );
}
