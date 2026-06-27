'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';
import PortionSelector from './PortionSelector';
import type { FoodAnalysis, Meal, MealType } from '@/types';
import { useT } from '@/providers/LanguageProvider';

/*
  CameraUpload component.

  Captures a photo (or selects from gallery), compresses it client-side,
  sends to /api/analyze-food, then shows the AI result with a PortionSelector
  so the user can adjust the serving before confirming.
*/

const MEAL_TYPE_KEYS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Props {
  onConfirm: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

export default function CameraUpload({ onConfirm }: Props) {
  const { t } = useT();
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
        let msg: string;
        if (data.code === 'NOT_CONFIGURED') {
          msg = t('camera.errorNotConfigured');
        } else if (res.status === 429 && data.code === 'DAILY_LIMIT') {
          msg = t('camera.errorDailyLimit');
        } else if (res.status === 429) {
          msg = t('camera.errorQuota');
        } else {
          msg = data.error || t('camera.errorAnalysis');
        }
        throw new Error(msg);
      }

      const data: FoodAnalysis = await res.json();
      setAnalysis(data);
      setStatus('review');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('camera.errorAnalysis'));
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
      setError(t('camera.errorSave'));
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
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-2xl py-3 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Camera size={18} />
          {t('camera.button')}
        </button>
      )}

      {status === 'analysing' && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          {t('camera.analysing')}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2 px-1">{error}</p>
      )}

      {(status === 'review' || status === 'saving') && analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-green-100 dark:border-green-900 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate pr-2">
              {analysis.name}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
            >
              {t('camera.retry')}
            </button>
          </div>

          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(analysis.calories * portion)} {t('macro.calories')}
            </span>
            <span>Б {Math.round(analysis.protein * portion)}г</span>
            <span>Ж {Math.round(analysis.fat * portion)}г</span>
            <span>У {Math.round(analysis.carbs * portion)}г</span>
          </div>

          <div className="mb-4">
            <PortionSelector value={portion} onChange={setPortion} />
          </div>

          <select
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-gray-100"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType | '')}
          >
            <option value="">— {t('addMeal.type')} —</option>
            {MEAL_TYPE_KEYS.map((mt) => (
              <option key={mt} value={mt}>
                {t(`addMeal.type.${mt}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>

          <button
            onClick={handleConfirm}
            disabled={status === 'saving'}
            className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {status === 'saving' ? t('camera.confirmAdding') : t('camera.confirm')}
          </button>
        </div>
      )}
    </div>
  );
}
