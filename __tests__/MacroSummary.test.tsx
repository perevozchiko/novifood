import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MacroSummary from '@/components/MacroSummary';
import type { Meal, Settings } from '@/types';

const settings: Settings = {
  id: 1,
  calorie_goal: 2200,
  protein_goal: 150,
  fat_goal: 80,
  carbs_goal: 250,
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
    render(<MacroSummary meals={meals} settings={settings} />);
    expect(screen.getByText('700')).toBeDefined();
  });

  it('render_ShouldShowCalorieGoal', () => {
    render(<MacroSummary meals={meals} settings={settings} />);
    expect(screen.getByText(/2200 ккал/)).toBeDefined();
  });

  it('render_ShouldShowZeroCalories_WhenNoMeals', () => {
    render(<MacroSummary meals={[]} settings={settings} />);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('render_ShouldDisplayMacroLabels', () => {
    render(<MacroSummary meals={meals} settings={settings} />);
    expect(screen.getByText('Белки')).toBeDefined();
    expect(screen.getByText('Жиры')).toBeDefined();
    expect(screen.getByText('Углеводы')).toBeDefined();
  });
});
