'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Meal, MealType } from '@/types';

/*
  AddMealForm component.

  Manual food entry form. Collects name, meal_type, and КБЖУ values.
  Calls onAdd with the new entry so the parent can optimistically update the list.
*/

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Ужин' },
  { value: 'snack', label: 'Перекус' },
];

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
      setError('Введите название блюда');
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
      setError('Не удалось сохранить. Попробуйте снова.');
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
        Добавить блюдо
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 shadow-sm border border-green-100"
    >
      <h2 className="font-semibold text-gray-900 mb-3">Новый приём пищи</h2>

      <input
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Название блюда"
        value={form.name}
        onChange={(e) => setField('name', e.target.value)}
        autoFocus
      />

      <select
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
        value={form.meal_type}
        onChange={(e) => setField('meal_type', e.target.value as MealType | '')}
      >
        <option value="">— Тип приёма пищи —</option>
        {MEAL_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {(
          [
            { key: 'calories', label: 'ккал' },
            { key: 'protein', label: 'Белки, г' },
            { key: 'fat', label: 'Жиры, г' },
            { key: 'carbs', label: 'Углев., г' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] text-gray-400 uppercase block mb-1">{label}</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
          {saving ? 'Сохранение…' : 'Добавить'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY);
            setError(null);
          }}
          className="px-4 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
