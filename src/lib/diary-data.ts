import {
  computeStreak,
  getMealDatesBrowser,
  getMealsByDateBrowser,
} from '@/lib/meals';
import { getSettingsBrowser } from '@/lib/settings';
import { getWaterByDateBrowser } from '@/lib/water-intake';
import type { Meal, Settings, WaterIntake } from '@/types';

export interface DiaryPayload {
  meals: Meal[];
  settings: Settings;
  streak: number;
  waterEntries: WaterIntake[];
}

export async function fetchDiaryData(dateStr: string): Promise<DiaryPayload> {
  const [meals, settings, loggedDates, waterEntries] = await Promise.all([
    getMealsByDateBrowser(dateStr),
    getSettingsBrowser(),
    getMealDatesBrowser(),
    getWaterByDateBrowser(dateStr).catch(() => [] as WaterIntake[]),
  ]);

  return {
    meals,
    settings,
    streak: computeStreak(loggedDates),
    waterEntries,
  };
}
