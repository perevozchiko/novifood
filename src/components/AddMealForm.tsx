'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Meal, MealType } from '@/types';
import { useT } from '@/providers/LanguageProvider';

/*
  AddMealForm component.

  Manual food entry form. Collects name, meal_type, and КБЖУ values.
  Calls onAdd with the new entry so the parent can optimistically update the list.
*/

const MEAL_TYPE_KEYS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Props {
  onAdd: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

const EMPTY = {
  name: '',
  meal_type: '' as MealType | '',
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

export default function AddMealForm({ onAdd }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('addMeal.errorName'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        name: form.name.trim(),
        meal_type: form.meal_type || null,
        calories: form.calories,
        protein: form.protein,
        fat: form.fat,
        carbs: form.carbs,
        eaten_at: new Date().toISOString(),
        notes: null,
      });
      setForm(EMPTY);
      setOpen(false);
    } catch {
      setError(t('addMeal.errorCalories'));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-2xl py-3 font-medium hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
      >
        <Plus size={20} />
        {t('addMeal.button')}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-green-100 dark:border-green-900"
    >
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('addMeal.title')}</h2>

      <input
        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        placeholder={t('addMeal.namePlaceholder')}
        value={form.name}
        onChange={(e) => setField('name', e.target.value)}
        autoFocus
      />

      <select
        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-gray-100"
        value={form.meal_type}
        onChange={(e) => setField('meal_type', e.target.value as MealType | '')}
      >
        <option value="">— {t('addMeal.type')} —</option>
        {MEAL_TYPE_KEYS.map((mt) => (
          <option key={mt} value={mt}>
            {t(`addMeal.type.${mt}` as Parameters<typeof t>[0])}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {(
          [
            { key: 'calories', labelKey: 'addMeal.calories' },
            { key: 'protein', labelKey: 'addMeal.protein' },
            { key: 'fat', labelKey: 'addMeal.fat' },
            { key: 'carbs', labelKey: 'addMeal.carbs' },
          ] as const
        ).map(({ key, labelKey }) => (
          <div key={key}>
            <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase block mb-1">
              {t(labelKey)}
            </label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-gray-100"
              value={form[key]}
              onChange={(e) => setField(key, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          {saving ? t('addMeal.adding') : t('addMeal.add')}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY);
            setError(null);
          }}
          className="px-4 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('addMeal.cancel')}
        </button>
      </div>
    </form>
  );
}
