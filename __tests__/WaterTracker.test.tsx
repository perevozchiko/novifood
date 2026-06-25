import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import WaterTracker from '@/components/WaterTracker';
import type { WaterIntake } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

/* Mock the water-intake lib so tests run without a real Supabase connection. */
vi.mock('@/lib/water-intake', () => ({
  addWaterIntake: vi.fn(),
  deleteWaterIntake: vi.fn(),
}));

import { addWaterIntake, deleteWaterIntake } from '@/lib/water-intake';

const GOAL = 2000;

const mockEntries: WaterIntake[] = [
  { id: 'w1', created_at: '2026-06-25T08:00:00Z', logged_at: '2026-06-25T08:00:00Z', amount_ml: 250 },
  { id: 'w2', created_at: '2026-06-25T10:00:00Z', logged_at: '2026-06-25T10:00:00Z', amount_ml: 500 },
];

describe('WaterTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render_ShouldShowWaterTitle', () => {
    renderWithProviders(<WaterTracker initialEntries={[]} goalMl={GOAL} />, { lang: 'ru' });
    expect(screen.getByText('Вода')).toBeDefined();
  });

  it('render_ShouldShowProgressText_WithZeroIntake', () => {
    renderWithProviders(<WaterTracker initialEntries={[]} goalMl={GOAL} />, { lang: 'ru' });
    expect(screen.getByText('0 / 2000 мл')).toBeDefined();
  });

  it('render_ShouldShowProgressText_WithExistingEntries', () => {
    renderWithProviders(<WaterTracker initialEntries={mockEntries} goalMl={GOAL} />, { lang: 'ru' });
    // 250 + 500 = 750 ml
    expect(screen.getByText('750 / 2000 мл')).toBeDefined();
  });

  it('render_ShouldShowQuickAddButtons', () => {
    renderWithProviders(<WaterTracker initialEntries={[]} goalMl={GOAL} />, { lang: 'ru' });
    expect(screen.getByText('+150 мл')).toBeDefined();
    expect(screen.getByText('+250 мл')).toBeDefined();
    expect(screen.getByText('+500 мл')).toBeDefined();
  });

  it('addWater_ShouldCallAddWaterIntake_WhenButtonClicked', async () => {
    const newEntry: WaterIntake = {
      id: 'w3',
      created_at: '2026-06-25T12:00:00Z',
      logged_at: '2026-06-25T12:00:00Z',
      amount_ml: 250,
    };
    vi.mocked(addWaterIntake).mockResolvedValue(newEntry);

    renderWithProviders(<WaterTracker initialEntries={[]} goalMl={GOAL} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('+250 мл'));

    await waitFor(() => {
      expect(addWaterIntake).toHaveBeenCalledWith(250);
    });
  });

  it('addWater_ShouldUpdateProgressText_AfterAdd', async () => {
    const newEntry: WaterIntake = {
      id: 'w3',
      created_at: '2026-06-25T12:00:00Z',
      logged_at: '2026-06-25T12:00:00Z',
      amount_ml: 500,
    };
    vi.mocked(addWaterIntake).mockResolvedValue(newEntry);

    renderWithProviders(<WaterTracker initialEntries={[]} goalMl={GOAL} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('+500 мл'));

    await waitFor(() => {
      expect(screen.getByText('500 / 2000 мл')).toBeDefined();
    });
  });

  it('deleteWater_ShouldCallDeleteWaterIntake_WhenDeleteButtonClicked', async () => {
    vi.mocked(deleteWaterIntake).mockResolvedValue(undefined);

    renderWithProviders(<WaterTracker initialEntries={mockEntries} goalMl={GOAL} />, { lang: 'ru' });

    const deleteButtons = screen.getAllByLabelText('Удалить запись');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteWaterIntake).toHaveBeenCalledOnce();
    });
  });

  it('deleteWater_ShouldUpdateProgress_AfterDelete', async () => {
    vi.mocked(deleteWaterIntake).mockResolvedValue(undefined);

    // Single entry of 500ml
    const single: WaterIntake[] = [mockEntries[1]];
    renderWithProviders(<WaterTracker initialEntries={single} goalMl={GOAL} />, { lang: 'ru' });

    fireEvent.click(screen.getByLabelText('Удалить запись'));

    await waitFor(() => {
      expect(screen.getByText('0 / 2000 мл')).toBeDefined();
    });
  });
});
