'use client';

/*
  SettingsClient — editable form for daily macro goals + appearance settings.

  Contains:
  - Macro goal inputs (calories, protein, fat, carbs)
  - Appearance section: theme toggle, language toggle, app version
*/

import { useState } from 'react';
import { Sun, Moon, Download, Trash2, AlertTriangle } from 'lucide-react';
import { updateSettings } from '@/lib/settings';
import { setCached } from '@/lib/client-cache';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { exportMealsCsv, exportWeightCsv } from '@/lib/export-csv';
import type { Settings } from '@/types';
import { useT } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

interface Props {
  settings: Settings;
}

export default function SettingsClient({ settings }: Props) {
  const { t, locale, setLocale } = useT();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    calorie_goal: settings.calorie_goal,
    protein_goal: settings.protein_goal,
    fat_goal: settings.fat_goal,
    carbs_goal: settings.carbs_goal,
    water_goal_ml: settings.water_goal_ml,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingMeals, setExportingMeals] = useState(false);
  const [exportingWeight, setExportingWeight] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  async function handleExportMeals() {
    setExportingMeals(true);
    try {
      const { data } = await supabaseBrowser
        .from('meals')
        .select('*')
        .order('eaten_at', { ascending: true });
      exportMealsCsv(data ?? []);
    } finally {
      setExportingMeals(false);
    }
  }

  async function handleExportWeight() {
    setExportingWeight(true);
    try {
      const { data } = await supabaseBrowser
        .from('weight')
        .select('*')
        .order('created_at', { ascending: true });
      exportWeightCsv(data ?? []);
    } finally {
      setExportingWeight(false);
    }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const [mealsResult, weightResult] = await Promise.all([
        supabaseBrowser.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabaseBrowser.from('weight').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        // water_intake may not exist if migration 0002 has not been applied yet —
        // ignore its error so the rest of the delete still succeeds.
        supabaseBrowser.from('water_intake').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      if (mealsResult.error || weightResult.error) throw new Error('delete failed');
      setDeleteSuccess(true);
      setShowDeleteConfirm(false);
    } catch {
      setDeleteError(t('settings.deleteAll.error'));
    } finally {
      setDeleting(false);
    }
  }

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
      const updated = await updateSettings(form);
      setCached('settings', updated);
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
    { key: 'water_goal_ml', labelKey: 'settings.waterGoal', unitKey: 'settings.waterMl' },
  ];

  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const gitHash = process.env.NEXT_PUBLIC_GIT_HASH;

  return (
    <div className="space-y-6 pt-6 pb-8">
      {/* ── Macro goals ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('settings.title')}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 -mt-2">{t('settings.subtitle')}</p>

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

      {/* ── Appearance ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
          {t('settings.appearance')}
        </h2>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('settings.theme')}
          </span>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                theme === 'light'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Sun size={14} />
              {t('settings.theme.light')}
            </button>
            <button
              type="button"
              onClick={() => theme === 'light' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Moon size={14} />
              {t('settings.theme.dark')}
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('settings.language')}
          </span>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
            {(['ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  locale === lang
                    ? 'bg-green-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Version */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('settings.version')}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
            v{version} ({gitHash})
          </span>
        </div>
      </div>

      {/* ── Data export ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
          {t('settings.data')}
        </h2>

        <button
          type="button"
          onClick={handleExportMeals}
          disabled={exportingMeals}
          className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {exportingMeals ? t('settings.export.loading') : t('settings.export.meals')}
          </span>
          <Download size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
        </button>

        <button
          type="button"
          onClick={handleExportWeight}
          disabled={exportingWeight}
          className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {exportingWeight ? t('settings.export.loading') : t('settings.export.weight')}
          </span>
          <Download size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
        </button>
      </div>

      {/* ── Danger zone ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-red-500 dark:text-red-400 px-1">
          {t('settings.danger')}
        </h2>

        {deleteSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 px-1">
            {t('settings.deleteAll.success')}
          </p>
        )}
        {deleteError && (
          <p className="text-sm text-red-500 px-1">{deleteError}</p>
        )}

        <button
          type="button"
          onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); setDeleteSuccess(false); }}
          className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
        >
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {t('settings.deleteAll')}
          </span>
          <Trash2 size={16} className="text-red-400 shrink-0" />
        </button>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.deleteAll')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {t('settings.deleteAll.warning')}
            </p>
            {deleteError && (
              <p className="text-sm text-red-500 mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('settings.deleteAll.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? t('settings.deleteAll.loading') : t('settings.deleteAll.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
