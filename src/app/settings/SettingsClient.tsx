'use client';

/*
  SettingsClient — editable form for daily macro goals.

  Saves via updateSettings and shows a success toast on completion.
*/

import { useState } from 'react';
import { updateSettings } from '@/lib/settings';
import type { Settings } from '@/types';

interface Props {
  settings: Settings;
}

const FIELDS: { key: keyof Omit<Settings, 'id'>; label: string; unit: string }[] = [
  { key: 'calorie_goal', label: 'Калории', unit: 'ккал' },
  { key: 'protein_goal', label: 'Белки', unit: 'г' },
  { key: 'fat_goal', label: 'Жиры', unit: 'г' },
  { key: 'carbs_goal', label: 'Углеводы', unit: 'г' },
];

export default function SettingsClient({ settings }: Props) {
  const [form, setForm] = useState({
    calorie_goal: settings.calorie_goal,
    protein_goal: settings.protein_goal,
    fat_goal: settings.fat_goal,
    carbs_goal: settings.carbs_goal,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: number) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateSettings(form);
      setSaved(true);
    } catch {
      setError('Не удалось сохранить. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELDS.map(({ key, label, unit }) => (
        <div key={key} className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-900">{label}</span>
            <span className="text-gray-400">{unit}</span>
          </label>
          <input
            type="number"
            min={0}
            value={form[key]}
            onChange={(e) => setField(key, Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-500 px-1">{error}</p>}
      {saved && <p className="text-sm text-green-600 px-1">Цели сохранены ✓</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-green-600 text-white rounded-2xl py-3 font-medium disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
      >
        {saving ? 'Сохранение…' : 'Сохранить'}
      </button>
    </form>
  );
}
