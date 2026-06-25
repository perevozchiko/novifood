import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import userEvent from '@testing-library/user-event';
import AddMealForm from '@/components/AddMealForm';

describe('AddMealForm', () => {
  it('render_ShouldShowAddButton_Initially', () => {
    render(<AddMealForm onAdd={vi.fn()} />);
    expect(screen.getByText('Добавить блюдо')).toBeDefined();
  });

  it('openForm_ShouldRevealInputFields_WhenButtonClicked', async () => {
    const user = userEvent.setup();
    render(<AddMealForm onAdd={vi.fn()} />);
    await user.click(screen.getByText('Добавить блюдо'));
    expect(screen.getByPlaceholderText('Название блюда')).toBeDefined();
  });

  it('submit_ShouldCallOnAdd_WithCorrectData_WhenFormIsFilledAndSubmitted', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddMealForm onAdd={onAdd} />);

    await user.click(screen.getByText('Добавить блюдо'));
    await user.type(screen.getByPlaceholderText('Название блюда'), 'Борщ');

    fireEvent.click(screen.getByText('Добавить'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledOnce();
      expect(onAdd.mock.calls[0][0].name).toBe('Борщ');
    });
  });

  it('submit_ShouldShowError_WhenNameIsEmpty', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddMealForm onAdd={onAdd} />);

    await user.click(screen.getByText('Добавить блюдо'));
    fireEvent.click(screen.getByText('Добавить'));

    expect(screen.getByText('Введите название блюда')).toBeDefined();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('cancel_ShouldCloseForm_WhenCancelButtonClicked', async () => {
    const user = userEvent.setup();
    render(<AddMealForm onAdd={vi.fn()} />);

    await user.click(screen.getByText('Добавить блюдо'));
    expect(screen.getByPlaceholderText('Название блюда')).toBeDefined();

    await user.click(screen.getByText('Отмена'));
    expect(screen.queryByPlaceholderText('Название блюда')).toBeNull();
  });
});
