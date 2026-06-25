'use client';

/*
  SettingsClient — editable form for daily macro goals.

  Saves via updateSettings and shows a success toast on completion.
*/

import { useState } from 'react';
import { updateSettings } from '@/lib/settings';
import type { Settings } from '@/types';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  settings: Settings;
}

export default function SettingsClient({ settings }: Props) {
  const { t } = useT();
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
      setError(t('settings.errorSave'));
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof typeof form; labelKey: Parameters<typeof t>[0]; unitKey: Parameters<typeof t>[0] }[] = [
    { key: 'calorie_goal', labelKey: 'settings.calories', unitKey: 'settings.kcal' },
    { key: 'protein_goal', labelKey: 'settings.protein', unitKey: 'settings.g' },
    { key: 'fat_goal', labelKey: 'settings.fat', unitKey: 'settings.g' },
    { key: 'carbs_goal', labelKey: 'settings.carbs', unitKey: 'settings.g' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('settings.title')}</h1>
      {fields.map(({ key, labelKey, unitKey }) => (
        <div key={key} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <label className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">{t(labelKey)}</span>
            <span className="text-gray-400 dark:text-gray-500">{t(unitKey)}</span>
          </label>
          <input
            type="number"
            min={0}
            value={form[key]}
            onChange={(e) => setField(key, Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-gray-100"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-500 px-1">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400 px-1">{t('settings.saved')}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-green-600 text-white rounded-2xl py-3 font-medium disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
      >
        {saving ? t('settings.saving') : t('settings.save')}
      </button>
    </form>
  );
}
