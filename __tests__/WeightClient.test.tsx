import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeightClient from '@/app/weight/WeightClient';
import type { Weight } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

/* Mock the weight lib so tests run without a real Supabase connection. */
vi.mock('@/lib/weight', () => ({
  addWeight: vi.fn(),
  deleteWeight: vi.fn(),
}));

import { addWeight, deleteWeight } from '@/lib/weight';

const mockHistory: Weight[] = [
  { id: 'w1', created_at: '2026-06-20T08:00:00Z', value: 80.5 },
  { id: 'w2', created_at: '2026-06-22T08:00:00Z', value: 80.1 },
  { id: 'w3', created_at: '2026-06-24T08:00:00Z', value: 79.8 },
];

describe('WeightClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render_ShouldShowTitle', () => {
    renderWithProviders(<WeightClient initialHistory={[]} />, { lang: 'ru' });
    expect(screen.getByText('Вес')).toBeDefined();
  });

  it('render_ShouldShowLatestWeight_WhenHistoryNotEmpty', () => {
    renderWithProviders(<WeightClient initialHistory={mockHistory} />, { lang: 'ru' });
    expect(screen.getByText('79.8')).toBeDefined();
  });

  it('render_ShouldShowEmptyMessage_WhenHistoryEmpty', () => {
    renderWithProviders(<WeightClient initialHistory={[]} />, { lang: 'ru' });
    expect(screen.getByText('Нет записей. Добавьте первое значение.')).toBeDefined();
  });

  it('render_ShouldShowHistoryList', () => {
    renderWithProviders(<WeightClient initialHistory={mockHistory} />, { lang: 'ru' });
    expect(screen.getAllByText(/кг/).length).toBeGreaterThan(1);
  });

  it('addWeight_ShouldCallAddWeight_WhenFormSubmitted', async () => {
    const newEntry: Weight = { id: 'w4', created_at: '2026-06-25T08:00:00Z', value: 79.5 };
    vi.mocked(addWeight).mockResolvedValue(newEntry);

    const user = userEvent.setup();
    renderWithProviders(<WeightClient initialHistory={mockHistory} />, { lang: 'ru' });

    const input = screen.getByPlaceholderText('72.5');
    await user.type(input, '79.5');
    fireEvent.click(screen.getByText('Добавить'));

    await waitFor(() => {
      expect(addWeight).toHaveBeenCalledWith(79.5);
    });
  });

  it('addWeight_ShouldShowError_WhenValueIsInvalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeightClient initialHistory={[]} />, { lang: 'ru' });

    fireEvent.click(screen.getByText('Добавить'));

    expect(screen.getByText('Введите корректный вес (кг)')).toBeDefined();
    expect(addWeight).not.toHaveBeenCalled();
  });

  it('deleteWeight_ShouldCallDeleteWeight_WhenDeleteButtonClicked', async () => {
    vi.mocked(deleteWeight).mockResolvedValue(undefined);

    renderWithProviders(<WeightClient initialHistory={mockHistory} />, { lang: 'ru' });

    const deleteButtons = screen.getAllByLabelText('Удалить запись');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteWeight).toHaveBeenCalledOnce();
    });
  });

  it('deleteWeight_ShouldRemoveEntry_FromListAfterDelete', async () => {
    vi.mocked(deleteWeight).mockResolvedValue(undefined);

    renderWithProviders(<WeightClient initialHistory={mockHistory} />, { lang: 'ru' });

    const deleteButtons = screen.getAllByLabelText('Удалить запись');
    // history is shown reversed (newest first), first button deletes the newest (w3, 79.8)
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('79.8')).toBeNull();
    });
  });
});
