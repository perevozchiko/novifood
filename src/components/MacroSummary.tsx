'use client';

import type { Meal, Settings } from '@/types';

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
  color: string;
}

function MacroBar({ label, value, goal, color }: MacroBarProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-500">
          {value} / {goal} г
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroSummary({ meals, settings }: Props) {
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      fat: acc.fat + (m.fat || 0),
      carbs: acc.carbs + (m.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  const calPct =
    settings.calorie_goal > 0
      ? Math.min(100, Math.round((totals.calories / settings.calorie_goal) * 100))
      : 0;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (calPct / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-6">
        {/* Calorie ring */}
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#16a34a"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{totals.calories}</span>
            <span className="text-[10px] text-gray-400">ккал</span>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex-1 space-y-2">
          <MacroBar
            label="Белки"
            value={totals.protein}
            goal={settings.protein_goal}
            color="bg-blue-400"
          />
          <MacroBar
            label="Жиры"
            value={totals.fat}
            goal={settings.fat_goal}
            color="bg-yellow-400"
          />
          <MacroBar
            label="Углеводы"
            value={totals.carbs}
            goal={settings.carbs_goal}
            color="bg-orange-400"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">
        Цель: {settings.calorie_goal} ккал · {calPct}% выполнено
      </p>
    </div>
  );
}
