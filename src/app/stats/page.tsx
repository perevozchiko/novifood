/*
  Weekly statistics page.

  Loads meals for the last 7 days and the user's calorie goal server-side,
  then passes pre-aggregated day stats to StatsClient.

  The page shell renders statically; data streams in via Suspense.
*/

import { Suspense } from 'react';
import { connection } from 'next/server';
import { getMealsByDateRange, getMealDates, computeStreak } from '@/lib/meals';
import { getSettings } from '@/lib/settings';
import StatsClient, { type DayStat } from './StatsClient';

function StatsSkeleton() {
  return (
    <div className="space-y-4 pt-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-56" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="h-28 bg-gray-100 dark:bg-gray-700 rounded w-full" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-28 mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function StatsDataLoader() {
  await connection();

  const today = new Date().toISOString().slice(0, 10);

  /* Build the last 7 calendar days, oldest first */
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const [meals, settings, loggedDates] = await Promise.all([
    getMealsByDateRange(days[0], today),
    getSettings(),
    getMealDates(),
  ]);

  /* Aggregate meals by day */
  const byDate = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>();
  for (const meal of meals) {
    const date = (meal.eaten_at as string).slice(0, 10);
    const prev = byDate.get(date) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    byDate.set(date, {
      calories: prev.calories + (meal.calories || 0),
      protein: prev.protein + (meal.protein || 0),
      fat: prev.fat + (meal.fat || 0),
      carbs: prev.carbs + (meal.carbs || 0),
    });
  }

  const weekStats: DayStat[] = days.map((date) => {
    const agg = byDate.get(date);
    return agg
      ? { date, ...agg, hasData: true }
      : { date, calories: 0, protein: 0, fat: 0, carbs: 0, hasData: false };
  });

  const streak = computeStreak(loggedDates);

  return <StatsClient weekStats={weekStats} settings={settings} streak={streak} />;
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsDataLoader />
    </Suspense>
  );
}
