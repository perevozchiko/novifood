'use client';

import type { Meal, MealType, Settings } from '@/types';
import { useT } from '@/providers/LanguageProvider';

/*
  MacroSummary widget.

  Displays calorie progress ring and protein/fat/carb progress bars
  based on today's totals versus user goals.
*/

interface Props {
  meals: Meal[];
  settings: Settings;
}

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type MacroTotals = Pick<Meal, 'calories' | 'protein' | 'fat' | 'carbs'>;

const emptyTotals: MacroTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

function addMealTotals(totals: MacroTotals, meal: Meal): MacroTotals {
  return {
    calories: totals.calories + (meal.calories || 0),
    protein: totals.protein + (meal.protein || 0),
    fat: totals.fat + (meal.fat || 0),
    carbs: totals.carbs + (meal.carbs || 0),
  };
}

function MacroBar({ label, value, goal, unit, color }: MacroBarProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {value} / {goal} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroSummary({ meals, settings }: Props) {
  const { t } = useT();

  const totals = meals.reduce(addMealTotals, emptyTotals);
  const totalsByMealType = MEAL_TYPES.reduce(
    (acc, mealType) => ({ ...acc, [mealType]: emptyTotals }),
    {} as Record<MealType, MacroTotals>,
  );

  meals.forEach((meal) => {
    if (meal.meal_type) {
      totalsByMealType[meal.meal_type] = addMealTotals(totalsByMealType[meal.meal_type], meal);
    }
  });

  const calPct =
    settings.calorie_goal > 0
      ? Math.round((totals.calories / settings.calorie_goal) * 100)
      : 0;
  const ringPct = Math.min(100, calPct);
  const isCalorieGoalExceeded = calPct > 100;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (ringPct / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-6">
        {/* Calorie ring */}
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={isCalorieGoalExceeded ? '#dc2626' : '#16a34a'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{totals.calories}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{t('macro.calories')}</span>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex-1 space-y-2">
          <MacroBar
            label={t('macro.protein')}
            value={totals.protein}
            goal={settings.protein_goal}
            unit={t('settings.g')}
            color="bg-blue-400"
          />
          <MacroBar
            label={t('macro.fat')}
            value={totals.fat}
            goal={settings.fat_goal}
            unit={t('settings.g')}
            color="bg-yellow-400"
          />
          <MacroBar
            label={t('macro.carbs')}
            value={totals.carbs}
            goal={settings.carbs_goal}
            unit={t('settings.g')}
            color="bg-orange-400"
          />
        </div>
      </div>
      <p
        className={`text-xs mt-3 text-right ${
          isCalorieGoalExceeded
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {t('macro.goal', settings.calorie_goal)} {t('macro.calories')} · {calPct}%
      </p>

      <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-3">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
          {t('macro.byMealType')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_TYPES.map((mealType) => {
            const mealTotals = totalsByMealType[mealType];
            return (
              <div
                key={mealType}
                className="rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3 py-2"
              >
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {t(`meal.type.${mealType}` as Parameters<typeof t>[0])}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {mealTotals.calories} {t('macro.calories')}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('macro.pAbbr')} {mealTotals.protein}{t('macro.g')} · {t('macro.fAbbr')}{' '}
                  {mealTotals.fat}{t('macro.g')} · {t('macro.cAbbr')} {mealTotals.carbs}{t('macro.g')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
