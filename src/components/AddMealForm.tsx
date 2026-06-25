'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Meal, MealType } from '@/types';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/providers/LanguageProvider';

/*
  AddMealForm component.

  Manual food entry form. Collects name, meal_type, and КБЖУ values.
  Calls onAdd with the new entry so the parent can optimistically update the list.
*/

interface Props {
  onAdd: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

const MEAL_TYPE_KEYS: { value: MealType; labelKey: TranslationKey }[] = [
  { value: 'breakfast', labelKey: 'meal_breakfast' },
  { value: 'lunch', labelKey: 'meal_lunch' },
  { value: 'dinner', labelKey: 'meal_dinner' },
  { value: 'snack', labelKey: 'meal_snack' },
];

const EMPTY = {
  name: '',
  meal_type: '' as MealType | '',
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

export default function AddMealForm({ onAdd }: Props) {
  const t = useT();
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
      setError(t('add_name_error'));
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
      setError(t('add_save_error'));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-2xl py-3 font-medium hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
      >
        <Plus size={20} />
        {t('add_open_btn')}
      </button>
    );
  }

  type MacroField = 'calories' | 'protein' | 'fat' | 'carbs';
  const macroFields: { key: MacroField; labelKey: TranslationKey }[] = [
    { key: 'calories', labelKey: 'meal_field_kcal' },
    { key: 'protein', labelKey: 'add_protein_label' },
    { key: 'fat', labelKey: 'add_fat_label' },
    { key: 'carbs', labelKey: 'add_carbs_label' },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-green-100 dark:border-green-900/40"
    >
      <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">{t('add_title')}</h2>

      <input
        className={inputClass + ' mb-3'}
        placeholder={t('add_name_placeholder')}
        value={form.name}
        onChange={(e) => setField('name', e.target.value)}
        autoFocus
      />

      <select
        className={inputClass + ' mb-3'}
        value={form.meal_type}
        onChange={(e) => setField('meal_type', e.target.value as MealType | '')}
      >
        <option value="">{t('meal_type_placeholder')}</option>
        {MEAL_TYPE_KEYS.map(({ value, labelKey }) => (
          <option key={value} value={value}>
            {t(labelKey)}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {macroFields.map(({ key, labelKey }) => (
          <div key={key}>
            <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase block mb-1">
              {t(labelKey)}
            </label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
          {saving ? t('meal_saving') : t('add_add')}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY);
            setError(null);
          }}
          className="px-4 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t('meal_cancel')}
        </button>
      </div>
    </form>
  );
}
