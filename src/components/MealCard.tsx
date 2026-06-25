'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { Meal, MealType } from '@/types';

/*
  MealCard component.

  Displays a single meal entry with macros. Supports inline editing
  of name, macros, and meal_type, and a delete action.
*/

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

interface Props {
  meal: Meal;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Meal>) => Promise<void>;
}

export default function MealCard({ meal, onDelete, onUpdate }: Props) {
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

  const typeLabel = meal.meal_type ? MEAL_TYPE_LABELS[meal.meal_type] : null;
  const time = new Date(meal.eaten_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (editing) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200">
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Название блюда"
        />
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={draft.meal_type ?? ''}
          onChange={(e) =>
            setDraft((d) => ({ ...d, meal_type: (e.target.value as MealType) || null }))
          }
        >
          <option value="">— Тип приёма пищи —</option>
          {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((t) => (
            <option key={t} value={t}>
              {MEAL_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['calories', 'protein', 'fat', 'carbs'] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">
                {field === 'calories' ? 'ккал' : field === 'protein' ? 'белки' : field === 'fat' ? 'жиры' : 'углев.'}
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={14} />
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{meal.name}</span>
          {typeLabel && (
            <span className="text-[10px] bg-green-50 text-green-700 rounded-full px-2 py-0.5 shrink-0">
              {typeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{meal.calories} ккал</span>
          <span>Б {meal.protein}г</span>
          <span>Ж {meal.fat}г</span>
          <span>У {meal.carbs}г</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Редактировать"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          aria-label="Удалить"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
