'use client';

/*
  DiaryClient — interactive diary shell.

  Manages the meal list state for the current day. All mutations
  (add / update / delete) go through the lib functions and update
  local state optimistically.
*/

import { useState } from 'react';
import MacroSummary from '@/components/MacroSummary';
import MealCard from '@/components/MealCard';
import AddMealForm from '@/components/AddMealForm';
import VoiceInput from '@/components/VoiceInput';
import WaterTracker from '@/components/WaterTracker';
import { addMeal, deleteMeal, updateMeal } from '@/lib/meals';
import type { Meal, Settings, WaterIntake } from '@/types';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  initialMeals: Meal[];
  settings: Settings;
  streak: number;
  initialWater: WaterIntake[];
}

export default function DiaryClient({ initialMeals, settings, streak, initialWater }: Props) {
  const { t } = useT();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);

  async function handleAdd(mealData: Omit<Meal, 'id' | 'created_at'>) {
    const created = await addMeal(mealData);
    setMeals((prev) => [...prev, created]);
  }

  async function handleDelete(id: string) {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleUpdate(id: string, updates: Partial<Meal>) {
    const updated = await updateMeal(id, updates);
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  return (
    <>
      {/* Streak badge — shown when the user has logged meals 2+ days in a row */}
      {streak >= 2 && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 mb-4">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t('stats.streak')}
            </p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {t('stats.streakDays', streak)}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <VoiceInput onConfirm={handleAdd} />
      </div>

      <MacroSummary meals={meals} settings={settings} />

      <div className="space-y-3 mb-6">
        {meals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">🥗</p>
            <p className="text-sm">{t('diary.empty')}</p>
            <p className="text-xs mt-1">{t('diary.emptyHint')}</p>
          </div>
        ) : (
          meals.map((m) => (
            <MealCard key={m.id} meal={m} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      <WaterTracker initialEntries={initialWater} goalMl={settings.water_goal_ml ?? 2000} />

      <div className="mt-6">
        <AddMealForm onAdd={handleAdd} />
      </div>
    </>
  );
}
