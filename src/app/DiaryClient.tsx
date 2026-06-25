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
import { useT } from '@/providers/LanguageProvider';

interface Props {
  initialMeals: Meal[];
  settings: Settings;
}

export default function DiaryClient({ initialMeals, settings }: Props) {
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

      <div className="space-y-3">
        <CameraUpload onConfirm={handleAdd} />
        <AddMealForm onAdd={handleAdd} />
      </div>
    </>
  );
}
