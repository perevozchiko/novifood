'use client';

/*
  SettingsClient — editable form for daily macro goals + appearance settings.

  Contains:
  - Macro goal inputs (calories, protein, fat, carbs)
  - Appearance section: theme toggle, language toggle, app version
*/

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Download, Upload, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { updateSettings } from '@/lib/settings';
import { setCached } from '@/lib/client-cache';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { exportMealsCsv, exportWeightCsv } from '@/lib/export-csv';
import {
  ImportCsvError,
  parseMealsCsv,
  parseWeightCsv,
  readCsvFile,
} from '@/lib/import-csv';
import type { Settings } from '@/types';
import { useT } from '@/providers/LanguageProvider';
import { usePwaUpdate } from '@/providers/PwaUpdateProvider';
import { useTheme } from '@/providers/ThemeProvider';

interface Props {
  settings: Settings;
}

export default function SettingsClient({ settings }: Props) {
  const { t, locale, setLocale } = useT();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { version, needRefresh, checking, applyUpdate, checkForUpdate, supported } = usePwaUpdate();

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
  const [importingMeals, setImportingMeals] = useState(false);
  const [importingWeight, setImportingWeight] = useState(false);
  const [importMealsSuccess, setImportMealsSuccess] = useState<string | null>(null);
  const [importWeightSuccess, setImportWeightSuccess] = useState<string | null>(null);
  const [importMealsError, setImportMealsError] = useState<string | null>(null);
  const [importWeightError, setImportWeightError] = useState<string | null>(null);
  const mealsFileRef = useRef<HTMLInputElement>(null);
  const weightFileRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await supabaseBrowser.auth.signOut();
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

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

  async function handleImportMealsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportingMeals(true);
    setImportMealsError(null);
    setImportMealsSuccess(null);
    try {
      const text = await readCsvFile(file);
      const rows = parseMealsCsv(text);
      if (rows.length === 0) {
        setImportMealsSuccess(t('settings.import.success', '0'));
        return;
      }

      const { error } = await supabaseBrowser.from('meals').insert(rows);
      if (error) throw error;
      setImportMealsSuccess(t('settings.import.success', String(rows.length)));
    } catch (err) {
      setImportMealsError(
        err instanceof ImportCsvError ? t('settings.import.invalidFormat') : t('settings.import.error'),
      );
    } finally {
      setImportingMeals(false);
    }
  }

  async function handleImportWeightFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportingWeight(true);
    setImportWeightError(null);
    setImportWeightSuccess(null);
    try {
      const text = await readCsvFile(file);
      const rows = parseWeightCsv(text);
      if (rows.length === 0) {
        setImportWeightSuccess(t('settings.import.success', '0'));
        return;
      }

      const { error } = await supabaseBrowser.from('weight').insert(rows);
      if (error) throw error;
      setImportWeightSuccess(t('settings.import.success', String(rows.length)));
    } catch (err) {
      setImportWeightError(
        err instanceof ImportCsvError ? t('settings.import.invalidFormat') : t('settings.import.error'),
      );
    } finally {
      setImportingWeight(false);
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

        {/* Version / PWA update */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('settings.version')}
          </span>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('update.current')}:{' '}
              <span className="font-mono text-gray-700 dark:text-gray-300">{version}</span>
            </span>
            {supported &&
              (needRefresh ? (
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  {t('update.now')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={checkForUpdate}
                  disabled={checking}
                  className="shrink-0 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {checking ? t('update.checking') : t('update.check')}
                </button>
              ))}
          </div>
          {supported && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {needRefresh ? t('update.available') : t('update.latest')}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('settings.pwaHint')}</p>
        </div>
      </div>

      {/* ── Data export / import ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
          {t('settings.data')}
        </h2>

        <input
          ref={mealsFileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportMealsFile}
        />
        <input
          ref={weightFileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportWeightFile}
        />

        {importMealsSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 px-1">{importMealsSuccess}</p>
        )}
        {importMealsError && (
          <p className="text-sm text-red-500 px-1">{importMealsError}</p>
        )}
        {importWeightSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 px-1">{importWeightSuccess}</p>
        )}
        {importWeightError && (
          <p className="text-sm text-red-500 px-1">{importWeightError}</p>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {exportingMeals ? t('settings.export.loading') : t('settings.export.meals')}
            </span>
            <button
              type="button"
              onClick={handleExportMeals}
              disabled={exportingMeals}
              aria-label={t('settings.export.meals')}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              <Download size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => mealsFileRef.current?.click()}
            disabled={importingMeals}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {importingMeals ? t('settings.import.loading') : t('settings.import.meals')}
            </span>
            <Upload size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {exportingWeight ? t('settings.export.loading') : t('settings.export.weight')}
            </span>
            <button
              type="button"
              onClick={handleExportWeight}
              disabled={exportingWeight}
              aria-label={t('settings.export.weight')}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              <Download size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => weightFileRef.current?.click()}
            disabled={importingWeight}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {importingWeight ? t('settings.import.loading') : t('settings.import.weight')}
            </span>
            <Upload size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* ── Account ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
          {t('settings.account')}
        </h2>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {loggingOut ? t('auth.loading') : t('settings.logout')}
          </span>
          <LogOut size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
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
