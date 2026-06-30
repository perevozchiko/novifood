'use client';

import { useCallback } from 'react';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { getWeightHistoryBrowser } from '@/lib/weight';
import WeightClient from './WeightClient';

function WeightSkeleton() {
  return (
    <div className="space-y-4 animate-pulse pt-6">
      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-24" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-24 mb-2" />
        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-32" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-28 mb-2" />
        <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  );
}

export default function WeightPage() {
  const fetcher = useCallback(() => getWeightHistoryBrowser(), []);
  const { data, isLoading } = useCachedQuery('weight', fetcher);

  return isLoading || !data ? <WeightSkeleton /> : <WeightClient initialHistory={data} />;
}
