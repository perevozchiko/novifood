'use client';

/*
  StatsClient — weekly statistics view.

  Renders a 7-day calorie bar chart and a summary table of average
  daily macros. All data is pre-computed server-side and passed as props.
*/

import { useT } from '@/providers/LanguageProvider';
import type { Settings } from '@/types';

export interface DayStat {
  date: string;       // YYYY-MM-DD
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  hasData: boolean;
}

interface Props {
  weekStats: DayStat[];
  settings: Settings;
  streak: number;
}

/* SVG bar chart: 7 bars, one per day, with a goal line. */
function WeekBarChart({
  weekStats,
  goalCalories,
}: {
  weekStats: DayStat[];
  goalCalories: number;
}) {
  const W = 300;
  const H = 120;
  const padX = 12;
  const padY = 12;
  const chartH = H - padY * 2;
  const barW = (W - padX * 2) / 7;
  const gap = 4;

  const maxVal = Math.max(...weekStats.map((d) => d.calories), goalCalories, 1);
  const goalY = padY + chartH - (goalCalories / maxVal) * chartH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Weekly calories chart"
    >
      {/* Goal line */}
      <line
        x1={padX}
        y1={goalY}
        x2={W - padX}
        y2={goalY}
        stroke="#16a34a"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />

      {weekStats.map((day, i) => {
        const x = padX + i * barW + gap / 2;
        const bw = barW - gap;
        const barH = day.hasData
          ? Math.max(2, (day.calories / maxVal) * chartH)
          : 0;
        const y = padY + chartH - barH;
        const over = day.calories > goalCalories;
        const color = !day.hasData ? '#e5e7eb' : over ? '#f97316' : '#16a34a';

        return (
          <g key={day.date}>
            <rect
              x={x}
              y={day.hasData ? y : padY + chartH - 2}
              width={bw}
              height={day.hasData ? barH : 2}
              rx={3}
              fill={color}
              opacity={day.hasData ? 0.85 : 0.3}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* Short weekday labels (Mon, Tue … or short locale day names) */
function dayLabel(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { weekday: 'short' },
  );
}

export default function StatsClient({ weekStats, settings, streak }: Props) {
  const { t, locale } = useT();

  const daysWithData = weekStats.filter((d) => d.hasData);
  const hasAny = daysWithData.length > 0;

  const avg = hasAny
    ? {
        calories: Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length),
        protein: Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length),
        fat: Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / daysWithData.length),
        carbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / daysWithData.length),
      }
    : null;

  const totals = hasAny
    ? {
        calories: daysWithData.reduce((s, d) => s + d.calories, 0),
        protein: daysWithData.reduce((s, d) => s + d.protein, 0),
        fat: daysWithData.reduce((s, d) => s + d.fat, 0),
        carbs: daysWithData.reduce((s, d) => s + d.carbs, 0),
      }
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 pt-6">
        {t('stats.title')}
      </h1>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {t('stats.streak')}
            </p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {t('stats.streakDays', streak)}
            </p>
          </div>
        </div>
      )}

      {/* Bar chart card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('stats.last7')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('stats.goal')}: {settings.calorie_goal} {t('stats.calories')}
          </p>
        </div>

        {hasAny ? (
          <>
            <WeekBarChart weekStats={weekStats} goalCalories={settings.calorie_goal} />
            {/* Day labels */}
            <div className="flex justify-between px-3 mt-1">
              {weekStats.map((day) => (
                <span
                  key={day.date}
                  className="text-[10px] text-gray-400 dark:text-gray-500 capitalize"
                >
                  {dayLabel(day.date, locale)}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            {t('stats.noData')}
          </p>
        )}
      </div>

      {/* Average macros */}
      {avg && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('stats.avgDay')}
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t('stats.calories'), value: avg.calories, unit: t('stats.calories') },
              { label: t('stats.protein'), value: avg.protein, unit: 'г' },
              { label: t('stats.fat'), value: avg.fat, unit: 'г' },
              { label: t('stats.carbs'), value: avg.carbs, unit: 'г' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="text-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase mb-1">
                  {label}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly totals */}
      {totals && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('stats.totalWeek')}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {totals.calories.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">{t('stats.calories')}</span>
          </div>
          <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{t('stats.protein')}: {totals.protein}г</span>
            <span>{t('stats.fat')}: {totals.fat}г</span>
            <span>{t('stats.carbs')}: {totals.carbs}г</span>
          </div>
        </div>
      )}
    </div>
  );
}
