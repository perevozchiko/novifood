'use client';

/*
  WaterTracker — daily water intake widget.

  Shows today's total water vs. the user's daily goal as a progress bar.
  Quick-add buttons let the user log 150 / 250 / 500 ml with one tap.
  Individual entries can be deleted via trash button.
*/

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { addWaterIntake, deleteWaterIntake } from '@/lib/water-intake';
import type { WaterIntake } from '@/types';
import { useT } from '@/providers/LanguageProvider';

const QUICK_AMOUNTS = [150, 250, 500] as const;

interface Props {
  initialEntries: WaterIntake[];
  goalMl: number;
}

export default function WaterTracker({ initialEntries, goalMl }: Props) {
  const { t, locale } = useT();
  const [entries, setEntries] = useState<WaterIntake[]>(initialEntries);
  const [savingAmount, setSavingAmount] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalMl = entries.reduce((s, e) => s + e.amount_ml, 0);
  const pct = Math.min(100, Math.round((totalMl / goalMl) * 100));
  const goalReached = totalMl >= goalMl;

  async function handleAdd(amount: number) {
    setSavingAmount(amount);
    setError(null);
    try {
      const entry = await addWaterIntake(amount);
      setEntries((prev) => [...prev, entry]);
    } catch {
      setError(t('water.saveError'));
    } finally {
      setSavingAmount(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWaterIntake(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError(t('water.deleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t('water.title')}
          </p>
        </div>
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {t('water.progress', totalMl, goalMl)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            goalReached ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 mb-3">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleAdd(amount)}
            disabled={savingAmount !== null}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            {t(`water.add${amount}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {/* Today's entries (most-recent first, max 5 shown) */}
      {entries.length > 0 && (
        <div className="space-y-1">
          {[...entries].reverse().slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
            >
              <span>
                {new Date(entry.logged_at).toLocaleTimeString(
                  locale === 'ru' ? 'ru-RU' : 'en-US',
                  { hour: '2-digit', minute: '2-digit' },
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{entry.amount_ml} {t('water.ml')}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors disabled:opacity-40"
                  aria-label={t('water.deleteAria')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
