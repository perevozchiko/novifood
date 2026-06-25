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
import CameraUpload from '@/components/CameraUpload';
import { addMeal, deleteMeal, updateMeal } from '@/lib/meals';
import type { Meal, Settings } from '@/types';
import { useT, useLang } from '@/providers/LanguageProvider';

interface Props {
  initialMeals: Meal[];
  settings: Settings;
  dateStr: string;
}

export default function DiaryClient({ initialMeals, settings, dateStr }: Props) {
  const t = useT();
  const { locale } = useLang();
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

  const todayFormatted = new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">{t('diary_title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{todayFormatted}</p>
      </header>

      <MacroSummary meals={meals} settings={settings} />

      <div className="space-y-3 mb-6">
        {meals.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">🥗</p>
            <p className="text-sm">{t('diary_empty')}</p>
            <p className="text-xs mt-1">{t('diary_empty_sub')}</p>
          </div>
        ) : (
          meals.map((m) => (
            <MealCard key={m.id} meal={m} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      <div className="space-y-3">
        <CameraUpload onConfirm={handleAdd} />
        <AddMealForm onAdd={handleAdd} />
      </div>
    </>
  );
}
