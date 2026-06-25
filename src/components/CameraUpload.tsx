'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';
import PortionSelector from './PortionSelector';
import type { FoodAnalysis, Meal, MealType } from '@/types';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/providers/LanguageProvider';

/*
  CameraUpload component.

  Captures a photo (or selects from gallery), compresses it client-side,
  sends to /api/analyze-food, then shows the AI result with a PortionSelector
  so the user can adjust the serving before confirming.
*/

const MEAL_TYPE_KEYS: { value: MealType; labelKey: TranslationKey }[] = [
  { value: 'breakfast', labelKey: 'meal_breakfast' },
  { value: 'lunch', labelKey: 'meal_lunch' },
  { value: 'dinner', labelKey: 'meal_dinner' },
  { value: 'snack', labelKey: 'meal_snack' },
];

interface Props {
  onConfirm: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

export default function CameraUpload({ onConfirm }: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'analysing' | 'review' | 'saving'>('idle');
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('analysing');
    setError(null);
    setAnalysis(null);
    setPortion(1);

    try {
      const base64 = await compressImage(file);
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `${t('camera_save_error')} ${res.status}`);
      }

      const data: FoodAnalysis = await res.json();
      setAnalysis(data);
      setStatus('review');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('camera_save_error'));
      setStatus('idle');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleConfirm() {
    if (!analysis) return;
    setStatus('saving');
    try {
      await onConfirm({
        name: analysis.name,
        meal_type: mealType || null,
        calories: Math.round(analysis.calories * portion),
        protein: Math.round(analysis.protein * portion),
        fat: Math.round(analysis.fat * portion),
        carbs: Math.round(analysis.carbs * portion),
        eaten_at: new Date().toISOString(),
        notes: null,
      });
      setStatus('idle');
      setAnalysis(null);
      setPortion(1);
      setMealType('');
    } catch {
      setError(t('camera_save_error'));
      setStatus('review');
    }
  }

  function handleReset() {
    setStatus('idle');
    setAnalysis(null);
    setError(null);
    setPortion(1);
    setMealType('');
  }

  return (
    <div>
      {/* Hidden file input — native camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {status === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 rounded-2xl py-3 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Camera size={18} />
          {t('camera_btn')}
        </button>
      )}

      {status === 'analysing' && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          {t('camera_analysing')}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2 px-1">{error}</p>
      )}

      {(status === 'review' || status === 'saving') && analysis && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-green-100 dark:border-green-900/40 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm truncate pr-2">
              {analysis.name}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              {t('camera_reset')}
            </button>
          </div>

          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {Math.round(analysis.calories * portion)} {t('macro_kcal')}
            </span>
            <span>{t('meal_p_abbr')} {Math.round(analysis.protein * portion)}{t('macro_g')}</span>
            <span>{t('meal_f_abbr')} {Math.round(analysis.fat * portion)}{t('macro_g')}</span>
            <span>{t('meal_c_abbr')} {Math.round(analysis.carbs * portion)}{t('macro_g')}</span>
          </div>

          <div className="mb-4">
            <PortionSelector value={portion} onChange={setPortion} />
          </div>

          <select
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType | '')}
          >
            <option value="">{t('meal_type_placeholder')}</option>
            {MEAL_TYPE_KEYS.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>

          <button
            onClick={handleConfirm}
            disabled={status === 'saving'}
            className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {status === 'saving' ? t('meal_saving') : t('camera_add_to_diary')}
          </button>
        </div>
      )}
    </div>
  );
}
