import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MealCard from '@/components/MealCard';
import type { Meal } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

const meal: Meal = {
  id: 'abc-123',
  created_at: '2026-06-24T08:00:00Z',
  eaten_at: '2026-06-24T08:30:00Z',
  name: 'Овсянка',
  meal_type: 'breakfast',
  calories: 300,
  protein: 10,
  fat: 5,
  carbs: 50,
  weight_grams: 150,
  notes: null,
};

describe('MealCard', () => {
  it('render_ShouldDisplayMealName', () => {
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Овсянка')).toBeDefined();
  });

  it('render_ShouldDisplayCalories', () => {
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText(/300 ккал/)).toBeDefined();
  });

  it('render_ShouldDisplayEatenWeight_WhenAvailable', () => {
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Вес: 150г')).toBeDefined();
  });

  it('render_ShouldDisplayMealTypeLabel', () => {
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Завтрак')).toBeDefined();
  });

  it('delete_ShouldCallOnDelete_WhenDeleteButtonClicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<MealCard meal={meal} onDelete={onDelete} onUpdate={vi.fn()} />, { lang: 'ru' });
    fireEvent.click(screen.getByLabelText('Удалить'));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('abc-123');
    });
  });

  it('edit_ShouldShowEditForm_WhenEditButtonClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });
    await user.click(screen.getByLabelText('Редактировать'));
    expect(screen.getByText('Сохранить')).toBeDefined();
  });

  it('edit_ShouldCallOnUpdate_WhenSaveClicked', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ ...meal, name: 'Гречка' });
    const user = userEvent.setup();
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={onUpdate} />, { lang: 'ru' });

    await user.click(screen.getByLabelText('Редактировать'));

    const nameInput = screen.getAllByDisplayValue('Овсянка')[0] as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Гречка');

    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('abc-123', expect.objectContaining({ name: 'Гречка' }));
    });
  });

  it('editCancel_ShouldRestoreOriginalData_WhenCancelClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MealCard meal={meal} onDelete={vi.fn()} onUpdate={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByLabelText('Редактировать'));
    await user.click(screen.getByText('Отмена'));

    expect(screen.getByText('Овсянка')).toBeDefined();
    expect(screen.queryByText('Сохранить')).toBeNull();
  });
});
