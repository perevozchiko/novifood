import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import StatsClient, { type DayStat } from '@/app/stats/StatsClient';
import type { Settings } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

const settings: Settings = {
  user_id: 'test-user',
  calorie_goal: 2000,
  protein_goal: 150,
  fat_goal: 70,
  carbs_goal: 200,
};

function makeDays(overrides: Partial<DayStat>[] = []): DayStat[] {
  const base: DayStat[] = Array.from({ length: 7 }, (_, i) => ({
    date: `2026-06-${String(19 + i).padStart(2, '0')}`,
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    hasData: false,
  }));
  overrides.forEach((ov, i) => Object.assign(base[i], ov));
  return base;
}

describe('StatsClient', () => {
  it('render_ShouldShowTitle', () => {
    renderWithProviders(
      <StatsClient weekStats={makeDays()} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.getByText('Статистика за неделю')).toBeDefined();
  });

  it('render_ShouldShowNoDataMessage_WhenAllDaysEmpty', () => {
    renderWithProviders(
      <StatsClient weekStats={makeDays()} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.getByText('Нет данных за этот период')).toBeDefined();
  });

  it('render_ShouldNotShowNoDataMessage_WhenSomeDaysHaveData', () => {
    const days = makeDays([{ calories: 1800, hasData: true }]);
    renderWithProviders(
      <StatsClient weekStats={days} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.queryByText('Нет данных за этот период')).toBeNull();
  });

  it('render_ShouldShowAverageSection_WhenDataExists', () => {
    const days = makeDays([
      { calories: 2000, protein: 150, fat: 70, carbs: 200, hasData: true },
    ]);
    renderWithProviders(
      <StatsClient weekStats={days} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.getByText('Среднее в день')).toBeDefined();
  });

  it('render_ShouldShowTotalsSection_WhenDataExists', () => {
    const days = makeDays([
      { calories: 1500, protein: 100, fat: 60, carbs: 180, hasData: true },
    ]);
    renderWithProviders(
      <StatsClient weekStats={days} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.getByText('Итого за неделю')).toBeDefined();
  });

  it('render_ShouldShowStreakBadge_WhenStreakPositive', () => {
    renderWithProviders(
      <StatsClient weekStats={makeDays()} settings={settings} streak={5} />,
      { lang: 'ru' },
    );
    expect(screen.getByText('Дней подряд')).toBeDefined();
    expect(screen.getByText('5 д')).toBeDefined();
  });

  it('render_ShouldNotShowStreakBadge_WhenStreakZero', () => {
    renderWithProviders(
      <StatsClient weekStats={makeDays()} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.queryByText('Дней подряд')).toBeNull();
  });

  it('render_ShouldDisplayGoalCalories', () => {
    renderWithProviders(
      <StatsClient weekStats={makeDays()} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    expect(screen.getByText(/2000/)).toBeDefined();
  });

  it('render_ShouldComputeCorrectAverage_ForMultipleDays', () => {
    const days = makeDays([
      { calories: 1000, protein: 80, fat: 40, carbs: 100, hasData: true },
      { calories: 2000, protein: 120, fat: 60, carbs: 200, hasData: true },
    ]);
    renderWithProviders(
      <StatsClient weekStats={days} settings={settings} streak={0} />,
      { lang: 'ru' },
    );
    // avg calories = (1000 + 2000) / 2 = 1500
    expect(screen.getByText('1500')).toBeDefined();
  });
});
