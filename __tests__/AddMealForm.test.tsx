import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddMealForm from '@/components/AddMealForm';
import { renderWithProviders } from './utils/renderWithProviders';

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Добавить блюдо'));
  return screen.getByRole('dialog');
}

describe('AddMealForm', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('render_ShouldShowAddButton_Initially', () => {
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Добавить блюдо')).toBeDefined();
  });

  it('openForm_ShouldRevealInputFields_WhenButtonClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    await openModal(user);
    expect(screen.getByPlaceholderText('Название блюда')).toBeDefined();
  });

  it('openForm_ShouldShowModalDialog_WhenButtonClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    const dialog = await openModal(user);
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByText('Новый приём пищи')).toBeDefined();
  });

  it('openForm_ShouldKeepAddButtonVisible_WhenModalIsOpen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    await openModal(user);
    expect(screen.getByText('Добавить блюдо')).toBeDefined();
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('openForm_ShouldLockBodyScroll_WhenModalIsOpen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    await openModal(user);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('close_ShouldHideModal_WhenBackdropClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    await openModal(user);
    await user.click(screen.getByRole('presentation'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('close_ShouldHideModal_WhenEscapePressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    await openModal(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('close_ShouldHideModal_WhenCloseIconClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });
    const dialog = await openModal(user);
    const [closeIcon] = within(dialog).getAllByRole('button', { name: 'Отмена' });
    await user.click(closeIcon);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('submit_ShouldCallOnAdd_WithCorrectData_WhenFormIsFilledAndSubmitted', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={onAdd} />, { lang: 'ru' });

    await user.click(screen.getByText('Добавить блюдо'));
    await user.type(screen.getByPlaceholderText('Название блюда'), 'Борщ');

    fireEvent.click(screen.getByText('Добавить'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledOnce();
      expect(onAdd.mock.calls[0][0].name).toBe('Борщ');
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('submit_ShouldShowError_WhenNameIsEmpty', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={onAdd} />, { lang: 'ru' });

    await user.click(screen.getByText('Добавить блюдо'));
    fireEvent.click(screen.getByText('Добавить'));

    expect(screen.getByText('Введите название блюда')).toBeDefined();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('cancel_ShouldCloseForm_WhenCancelButtonClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealForm onAdd={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Добавить блюдо'));
    expect(screen.getByPlaceholderText('Название блюда')).toBeDefined();

    await user.click(screen.getByText('Отмена'));
    expect(screen.queryByPlaceholderText('Название блюда')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});
