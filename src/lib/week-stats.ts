import {
  computeStreak,
  getMealDatesBrowser,
  getMealsByDateRangeBrowser,
} from '@/lib/meals';
import { getSettingsBrowser } from '@/lib/settings';
import type { DayStat } from '@/app/stats/StatsClient';
import type { Settings } from '@/types';

export interface WeekStatsPayload {
  weekStats: DayStat[];
  settings: Settings;
  streak: number;
}

export async function fetchWeekStats(): Promise<WeekStatsPayload> {
  const today = new Date().toISOString().slice(0, 10);

  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const [meals, settings, loggedDates] = await Promise.all([
    getMealsByDateRangeBrowser(days[0], today),
    getSettingsBrowser(),
    getMealDatesBrowser(),
  ]);

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

  return {
    weekStats,
    settings,
    streak: computeStreak(loggedDates),
  };
}
