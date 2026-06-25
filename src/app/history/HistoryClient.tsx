'use client';

/*
  HistoryClient — calendar navigation + day view.

  Fetches meals for the selected day via Supabase browser client,
  allows editing and deleting entries inline, and shows a MacroSummary
  for the selected day.

  Today's date is computed client-side (the component is wrapped in
  Suspense in the page so new Date() is safe here).
*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import MealCard from '@/components/MealCard';
import MacroSummary from '@/components/MacroSummary';
import { deleteMeal, updateMeal } from '@/lib/meals';
import type { Meal, Settings } from '@/types';
import { useT } from '@/providers/LanguageProvider';
import { formatDate } from '@/lib/i18n';

interface Props {
  settings: Settings;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function HistoryClient({ settings }: Props) {
  const { t, locale } = useT();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMeals = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const from = `${dateStr}T00:00:00.000Z`;
      const to = `${dateStr}T23:59:59.999Z`;
      const { data, error } = await supabaseBrowser
        .from('meals')
        .select('*')
        .gte('eaten_at', from)
        .lte('eaten_at', to)
        .order('eaten_at', { ascending: true });
      if (error) throw error;
      setMeals(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals(selectedDate);
  }, [selectedDate, fetchMeals]);

  function navigate(delta: number) {
    const next = addDays(selectedDate, delta);
    if (next <= today) setSelectedDate(next);
  }

  async function handleDelete(id: string) {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleUpdate(id: string, updates: Partial<Meal>) {
    const updated = await updateMeal(id, updates);
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  const isToday = selectedDate === today;
  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);

  const displayDate = isToday
    ? t('history.today')
    : formatDate(locale, selectedDate, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Предыдущий день"
        >
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {displayDate}
          </p>
          {!isToday && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{selectedDate}</p>
          )}
        </div>

        <button
          onClick={() => navigate(1)}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
          aria-label="Следующий день"
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
          {t('history.loading')}
        </div>
      )}

      {!loading && meals.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center text-gray-400 dark:text-gray-500">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm">{t('history.empty')}</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <>
          <MacroSummary meals={meals} settings={settings} />

          <div className="space-y-3">
            {meals.map((m) => (
              <MealCard key={m.id} meal={m} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-3">
            {t('history.total', totalCal)}
          </p>
        </>
      )}
    </div>
  );
}
