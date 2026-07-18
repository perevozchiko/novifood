import {
  computeStreak,
  getMealDatesBrowser,
  getMealsByDateBrowser,
} from '@/lib/meals';
import { getSettingsBrowser } from '@/lib/settings';
import type { Meal, Settings } from '@/types';

export interface DiaryPayload {
  meals: Meal[];
  settings: Settings;
  streak: number;
}

export async function fetchDiaryData(dateStr: string): Promise<DiaryPayload> {
  const [meals, settings, loggedDates] = await Promise.all([
    getMealsByDateBrowser(dateStr),
    getSettingsBrowser(),
    getMealDatesBrowser(),
  ]);

  return {
    meals,
    settings,
    streak: computeStreak(loggedDates),
  };
}
