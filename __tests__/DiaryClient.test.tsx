import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiaryClient from '@/app/DiaryClient';
import { renderWithProviders } from './utils/renderWithProviders';
import type { Meal, Settings } from '@/types';

const addedMeal: Meal = {
  id: 'new',
  created_at: '2026-06-25T12:00:00Z',
  eaten_at: '2026-06-25T12:00:00Z',
  name: 'Новое блюдо',
  meal_type: 'lunch',
  calories: 300,
  protein: 10,
  fat: 8,
  carbs: 40,
  notes: null,
};

vi.mock('@/lib/meals', () => ({
  addMeal: vi.fn(),
  deleteMeal: vi.fn(),
  updateMeal: vi.fn(),
}));

vi.mock('@/components/AddMealForm', () => ({
  default: ({ onAdd }: { onAdd: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void> }) => (
    <button type="button" onClick={() => void onAdd(addedMeal)}>Добавить тестовое блюдо</button>
  ),
}));

vi.mock('@/components/VoiceInput', () => ({ default: () => null }));
vi.mock('@/components/MacroSummary', () => ({ default: () => null }));
vi.mock('@/components/MealCard', () => ({
  default: ({ meal }: { meal: Meal }) => <div data-testid="meal-card">{meal.name}</div>,
}));

import { addMeal } from '@/lib/meals';

const settings: Settings = {
  user_id: 'user-1',
  calorie_goal: 2000,
  protein_goal: 100,
  fat_goal: 70,
  carbs_goal: 250,
};

const initialMeal: Meal = {
  ...addedMeal,
  id: 'old',
  name: 'Старое блюдо',
  created_at: '2026-06-25T08:00:00Z',
  eaten_at: '2026-06-25T08:00:00Z',
};

describe('DiaryClient', () => {
  it('addMeal_ShouldPlaceNewMealAtTopOfList', async () => {
    vi.mocked(addMeal).mockResolvedValue(addedMeal);
    const user = userEvent.setup();

    renderWithProviders(
      <DiaryClient initialMeals={[initialMeal]} settings={settings} streak={0} />,
      { lang: 'ru' },
    );

    await user.click(screen.getByRole('button', { name: 'Добавить тестовое блюдо' }));

    await waitFor(() => {
      expect(screen.getAllByTestId('meal-card').map((card) => card.textContent)).toEqual([
        'Новое блюдо',
        'Старое блюдо',
      ]);
    });
  });
});
