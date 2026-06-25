'use client';

/*
  SettingsClient — editable form for daily macro goals.

  Saves via updateSettings and shows a success toast on completion.
*/

import { useState } from 'react';
import { updateSettings } from '@/lib/settings';
import type { Settings } from '@/types';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  settings: Settings;
}

export default function SettingsClient({ settings }: Props) {
  const t = useT();

  const fields: { key: keyof Omit<Settings, 'id'>; labelKey: TranslationKey; unitKey: TranslationKey }[] = [
    { key: 'calorie_goal', labelKey: 'settings_calories', unitKey: 'settings_kcal' },
    { key: 'protein_goal', labelKey: 'settings_protein', unitKey: 'settings_g' },
    { key: 'fat_goal', labelKey: 'settings_fat', unitKey: 'settings_g' },
    { key: 'carbs_goal', labelKey: 'settings_carbs', unitKey: 'settings_g' },
  ];

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
      setError(t('settings_save_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-50">{t('settings_title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('settings_subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, labelKey, unitKey }) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <label className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-50">{t(labelKey)}</span>
              <span className="text-gray-400 dark:text-gray-500">{t(unitKey)}</span>
            </label>
            <input
              type="number"
              min={0}
              value={form[key]}
              onChange={(e) => setField(key, Number(e.target.value))}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}
        {saved && <p className="text-sm text-green-600 px-1">{t('settings_saved')}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 text-white rounded-2xl py-3 font-medium disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
        >
          {saving ? t('settings_saving') : t('settings_save')}
        </button>
      </form>
    </>
  );
}
