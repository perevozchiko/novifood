'use client';

import { useCallback, useMemo } from 'react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { fetchDiaryData } from '@/lib/diary-data';
import LoadError from '@/components/LoadError';
import DiaryClient from './DiaryClient';
import TodayDate from './TodayDate';

export function DiarySkeleton() {
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6 animate-pulse">
        <div className="flex justify-center mb-3">
          <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full" />
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mx-auto" />
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse mb-3">
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
        </div>
      ))}
    </>
  );
}

export default function HomeClient() {
  const dateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const fetcher = useCallback(() => fetchDiaryData(dateStr), [dateStr]);
  const { data, isLoading, error, refetch } = useAuthenticatedQuery(`diary:${dateStr}`, fetcher);

  return (
    <div className="pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">NoviFood</h1>
        <TodayDate />
      </header>

      {error ? (
        <LoadError onRetry={refetch} />
      ) : isLoading || !data ? (
        <DiarySkeleton />
      ) : (
        <DiaryClient
          initialMeals={data.meals}
          settings={data.settings}
          streak={data.streak}
          initialWater={data.waterEntries}
        />
      )}
    </div>
  );
}
