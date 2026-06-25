/*
  Main diary screen — shows today's meals and macro summary.

  The page header renders as a static shell immediately on navigation.
  Meal data and settings stream in via a Suspense boundary, enabling
  instant client-side navigation without blocking on Supabase.

  connection() before new Date() ensures the date is evaluated at
  request time (not build/prerender time) per Next.js 16 requirements.
*/

import { Suspense } from 'react';
import { connection } from 'next/server';
import { getMealsByDate, getMealDates, computeStreak } from '@/lib/meals';
import { getSettings } from '@/lib/settings';
import { getWaterByDate } from '@/lib/water-intake';
import DiaryClient from './DiaryClient';
import TodayDate from './TodayDate';

function DiarySkeleton() {
  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 animate-pulse">
        <div className="flex justify-center mb-3">
          <div className="w-32 h-32 rounded-full bg-gray-100" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-3/4 mx-auto" />
          <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse mb-3">
          <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      ))}
    </>
  );
}

async function DiaryDataLoader() {
  await connection();
  const dateStr = new Date().toISOString().slice(0, 10);

  /*
   * getWaterByDate is caught individually: if the water_intake table does not
   * yet exist in the database (migration 0002 pending), a Supabase error would
   * otherwise crash the whole page. An empty array is a safe fallback — the
   * WaterTracker renders with zero entries and still allows adding water.
   */
  const [meals, settings, loggedDates, waterEntries] = await Promise.all([
    getMealsByDate(dateStr),
    getSettings(),
    getMealDates(),
    getWaterByDate(dateStr).catch(() => [] as Awaited<ReturnType<typeof getWaterByDate>>),
  ]);
  const streak = computeStreak(loggedDates);
  return (
    <DiaryClient
      initialMeals={meals}
      settings={settings}
      streak={streak}
      initialWater={waterEntries}
    />
  );
}

export default function HomePage() {
  return (
    <div className="pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">NoviFood</h1>
        <Suspense fallback={<p className="text-sm text-gray-500 h-4" />}>
          <TodayDate />
        </Suspense>
      </header>

      <Suspense fallback={<DiarySkeleton />}>
        <DiaryDataLoader />
      </Suspense>
    </div>
  );
}
