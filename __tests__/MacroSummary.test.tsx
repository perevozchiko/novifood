import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import MacroSummary from '@/components/MacroSummary';
import type { Meal, Settings } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

const settings: Settings = {
  user_id: 'test-user',
  calorie_goal: 2200,
  protein_goal: 150,
  fat_goal: 80,
  carbs_goal: 250,
  water_goal_ml: 2000,
};

const meals: Meal[] = [
  {
    id: '1',
    created_at: '2026-06-24T08:00:00Z',
    eaten_at: '2026-06-24T08:00:00Z',
    name: 'Овсянка',
    meal_type: 'breakfast',
    calories: 300,
    protein: 10,
    fat: 5,
    carbs: 50,
    notes: null,
  },
  {
    id: '2',
    created_at: '2026-06-24T12:00:00Z',
    eaten_at: '2026-06-24T12:00:00Z',
    name: 'Куриная грудка',
    meal_type: 'lunch',
    calories: 400,
    protein: 50,
    fat: 8,
    carbs: 0,
    notes: null,
  },
];

describe('MacroSummary', () => {
  it('render_ShouldDisplayCorrectCalorieTotal', () => {
    renderWithProviders(<MacroSummary meals={meals} settings={settings} />, { lang: 'ru' });
    expect(screen.getByText('700')).toBeDefined();
  });

  it('render_ShouldShowCalorieGoal', () => {
    renderWithProviders(<MacroSummary meals={meals} settings={settings} />, { lang: 'ru' });
    expect(screen.getByText(/2200 ккал/)).toBeDefined();
  });

  it('render_ShouldShowZeroCalories_WhenNoMeals', () => {
    renderWithProviders(<MacroSummary meals={[]} settings={settings} />, { lang: 'ru' });
    expect(screen.getByText('0')).toBeDefined();
  });

  it('render_ShouldShowOverageInRed_AndKeepActualPercentage', () => {
    const mealsOverGoal: Meal[] = [{ ...meals[0], calories: 2640 }];

    const { container } = renderWithProviders(
      <MacroSummary meals={mealsOverGoal} settings={settings} />,
      { lang: 'ru' },
    );

    expect(screen.getByText(/120%/).classList.contains('text-red-600')).toBe(true);
    expect(container.querySelector('svg circle:nth-of-type(2)')?.getAttribute('stroke')).toBe('#dc2626');
  });

  it('render_ShouldDisplayMacroLabels', () => {
    renderWithProviders(<MacroSummary meals={meals} settings={settings} />, { lang: 'ru' });
    expect(screen.getByText('Белки')).toBeDefined();
    expect(screen.getByText('Жиры')).toBeDefined();
    expect(screen.getByText('Углеводы')).toBeDefined();
  });

  it('render_ShouldDisplayTotalsByMealType', () => {
    renderWithProviders(<MacroSummary meals={meals} settings={settings} />, { lang: 'ru' });

    expect(screen.getByText('По приёмам пищи')).toBeDefined();
    expect(screen.getByText('Завтрак')).toBeDefined();
    expect(screen.getByText('Обед')).toBeDefined();
    expect(screen.getByText('300 ккал')).toBeDefined();
    expect(screen.getByText('400 ккал')).toBeDefined();
    expect(screen.getByText('Б 10г · Ж 5г · У 50г')).toBeDefined();
    expect(screen.getByText('Б 50г · Ж 8г · У 0г')).toBeDefined();
  });

  it('render_ShouldDisplayEnglishLabels_WhenLangIsEn', () => {
    renderWithProviders(<MacroSummary meals={meals} settings={settings} />, { lang: 'en' });
    expect(screen.getByText('Protein')).toBeDefined();
    expect(screen.getByText('Fat')).toBeDefined();
    expect(screen.getByText('Carbs')).toBeDefined();
  });
});
