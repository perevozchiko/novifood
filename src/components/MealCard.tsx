'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { Meal, MealType } from '@/types';
import type { TranslationKey } from '@/lib/i18n';
import { useT, useLang } from '@/providers/LanguageProvider';

/*
  MealCard component.

  Displays a single meal entry with macros. Supports inline editing
  of name, macros, and meal_type, and a delete action.
*/

const MEAL_TYPE_KEYS: Record<MealType, TranslationKey> = {
  breakfast: 'meal_breakfast',
  lunch: 'meal_lunch',
  dinner: 'meal_dinner',
  snack: 'meal_snack',
};

interface Props {
  meal: Meal;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Meal>) => Promise<void>;
}

export default function MealCard({ meal, onDelete, onUpdate }: Props) {
  const t = useT();
  const { locale } = useLang();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    fat: meal.fat,
    carbs: meal.carbs,
    meal_type: meal.meal_type,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(meal.id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
      meal_type: meal.meal_type,
    });
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(meal.id);
    } finally {
      setDeleting(false);
    }
  }

  const typeLabel = meal.meal_type ? t(MEAL_TYPE_KEYS[meal.meal_type]) : null;
  const time = new Date(meal.eaten_at).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const inputClass =
    'w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400';

  const fieldLabels: Record<'calories' | 'protein' | 'fat' | 'carbs', TranslationKey> = {
    calories: 'meal_field_kcal',
    protein: 'meal_field_protein',
    fat: 'meal_field_fat',
    carbs: 'meal_field_carbs',
  };

  if (editing) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-green-200 dark:border-green-900">
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder={t('add_name_placeholder')}
        />
        <select
          className={inputClass}
          value={draft.meal_type ?? ''}
          onChange={(e) =>
            setDraft((d) => ({ ...d, meal_type: (e.target.value as MealType) || null }))
          }
        >
          <option value="">{t('meal_type_placeholder')}</option>
          {(Object.keys(MEAL_TYPE_KEYS) as MealType[]).map((mType) => (
            <option key={mType} value={mType}>
              {t(MEAL_TYPE_KEYS[mType])}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['calories', 'protein', 'fat', 'carbs'] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase block mb-1">
                {t(fieldLabels[field])}
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                value={draft[field]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
            className="flex items-center gap-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            <Check size={14} />
            {saving ? t('meal_saving') : t('meal_save')}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
            {t('meal_cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-gray-50 truncate">{meal.name}</span>
          {typeLabel && (
            <span className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 shrink-0">
              {typeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{time}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {meal.calories} {t('macro_kcal')}
          </span>
          <span>{t('meal_p_abbr')} {meal.protein}{t('macro_g')}</span>
          <span>{t('meal_f_abbr')} {meal.fat}{t('macro_g')}</span>
          <span>{t('meal_c_abbr')} {meal.carbs}{t('macro_g')}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={t('meal_edit_aria')}
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          aria-label={t('meal_delete_aria')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
