'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Meal, MealType } from '@/types';
import { getRecentMeals } from '@/lib/meals';
import { useT } from '@/providers/LanguageProvider';

/*
  AddMealForm component.

  Manual food entry form. Collects name, meal_type, КБЖУ values, and
  an optional notes field. Calls onAdd with the new entry so the parent
  can optimistically update the list.
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
  notes: '',
};

export default function AddMealForm({ onAdd }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setError(null);
  }

  /* Fetch recent meals once when the form opens. */
  useEffect(() => {
    if (!open) return;
    getRecentMeals(5).then(setRecentMeals).catch(() => {});
  }, [open]);

  /* Close on Escape; lock body scroll while the modal is open. */
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  function applyRecent(meal: Meal) {
    setForm({
      name: meal.name,
      meal_type: meal.meal_type ?? '',
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
      notes: meal.notes ?? '',
    });
    setError(null);
  }

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
        notes: form.notes.trim() || null,
      });
      setForm(EMPTY);
      close();
    } catch {
      setError(t('addMeal.errorCalories'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-2xl py-3 font-medium hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
      >
        <Plus size={20} />
        {t('addMeal.button')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-meal-title"
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-green-100 dark:border-green-900 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-3">
                <h2
                  id="add-meal-title"
                  className="font-semibold text-gray-900 dark:text-gray-100"
                >
                  {t('addMeal.title')}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t('addMeal.cancel')}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recent meal chips — quick-fill from previous entries */}
              {recentMeals.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {t('addMeal.recent')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentMeals.map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => applyRecent(meal)}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-1 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-400 transition-colors truncate max-w-[120px]"
                        title={`${meal.name} — ${meal.calories} ккал`}
                      >
                        {meal.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-4 gap-2 mb-3">
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

              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400"
                rows={2}
                placeholder={t('meal.notesPlaceholder')}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />

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
                  onClick={close}
                  className="px-4 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('addMeal.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
