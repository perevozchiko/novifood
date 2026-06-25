import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsClient from '@/app/settings/SettingsClient';
import type { Settings } from '@/types';
import { renderWithProviders } from './utils/renderWithProviders';

/* Mock the settings lib so tests run without a real Supabase connection. */
vi.mock('@/lib/settings', () => ({
  updateSettings: vi.fn(),
}));

import { updateSettings } from '@/lib/settings';

const settings: Settings = {
  id: 1,
  calorie_goal: 2200,
  protein_goal: 150,
  fat_goal: 80,
  carbs_goal: 250,
};

describe('SettingsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render_ShouldShowTitle', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    expect(screen.getByText('Цели КБЖУ')).toBeDefined();
  });

  it('render_ShouldShowCurrentGoalValues', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('2200');
    expect(inputs[1].value).toBe('150');
    expect(inputs[2].value).toBe('80');
    expect(inputs[3].value).toBe('250');
  });

  it('render_ShouldShowFieldLabels_InRussian', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    expect(screen.getByText('Калории')).toBeDefined();
    expect(screen.getByText('Белки')).toBeDefined();
    expect(screen.getByText('Жиры')).toBeDefined();
    expect(screen.getByText('Углеводы')).toBeDefined();
  });

  it('render_ShouldShowFieldLabels_InEnglish', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    expect(screen.getByText('Calories')).toBeDefined();
    expect(screen.getByText('Protein')).toBeDefined();
    expect(screen.getByText('Fat')).toBeDefined();
    expect(screen.getByText('Carbs')).toBeDefined();
  });

  it('save_ShouldCallUpdateSettings_WhenFormSubmitted', async () => {
    vi.mocked(updateSettings).mockResolvedValue(undefined as never);

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({
        calorie_goal: 2200,
        protein_goal: 150,
        fat_goal: 80,
        carbs_goal: 250,
      });
    });
  });

  it('save_ShouldShowSuccessMessage_AfterSave', async () => {
    vi.mocked(updateSettings).mockResolvedValue(undefined as never);

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(screen.getByText('Цели сохранены ✓')).toBeDefined();
    });
  });

  it('save_ShouldShowError_WhenSaveFails', async () => {
    vi.mocked(updateSettings).mockRejectedValue(new Error('network error'));

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(screen.getByText('Не удалось сохранить. Попробуйте снова.')).toBeDefined();
    });
  });

  it('save_ShouldCallUpdateSettings_WithUpdatedValue_WhenFieldChanged', async () => {
    vi.mocked(updateSettings).mockResolvedValue(undefined as never);
    const user = userEvent.setup();

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    await user.clear(inputs[0]);
    await user.type(inputs[0], '2500');

    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ calorie_goal: 2500 }),
      );
    });
  });
});
