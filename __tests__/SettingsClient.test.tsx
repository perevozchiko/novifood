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

const { exportMealsCsv, exportWeightCsv } = vi.hoisted(() => ({
  exportMealsCsv: vi.fn(),
  exportWeightCsv: vi.fn(),
}));

vi.mock('@/lib/export-csv', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/export-csv')>();
  return {
    ...actual,
    exportMealsCsv,
    exportWeightCsv,
  };
});

/* Mock supabaseBrowser for delete-all functionality. */
const { mockFrom, mockSignOut } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockSignOut = vi.fn().mockResolvedValue({ error: null });
  return { mockFrom, mockSignOut };
});

vi.mock('@/lib/supabase-browser', () => ({
  supabaseBrowser: {
    from: (table: string) => mockFrom(table),
    auth: { signOut: mockSignOut },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { updateSettings } from '@/lib/settings';
import { MEALS_CSV_HEADER, WEIGHT_CSV_HEADER } from '@/lib/export-csv';

function setFileInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  fireEvent.change(input);
}

const settings: Settings = {
  user_id: 'test-user',
  calorie_goal: 2200,
  protein_goal: 150,
  fat_goal: 80,
  carbs_goal: 250,
  water_goal_ml: 2000,
};

describe('SettingsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    /* Default mock for select/order/delete chains used by export and delete handlers. */
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      delete: vi.fn().mockReturnThis(),
      neq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chainMock);
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
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          calorie_goal: 2200,
          protein_goal: 150,
          fat_goal: 80,
          carbs_goal: 250,
        }),
      );
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

  it('deleteAll_ShouldShowConfirmDialog_WhenDeleteButtonClicked', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Удалить все данные'));
    expect(screen.getByText('Да, удалить всё')).toBeDefined();
  });

  it('deleteAll_ShouldHideConfirmDialog_WhenCancelClicked', () => {
    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Удалить все данные'));
    fireEvent.click(screen.getAllByText('Отмена')[0]);
    expect(screen.queryByText('Да, удалить всё')).toBeNull();
  });

  it('deleteAll_ShouldCallDeleteOnAllTables_WhenConfirmed', async () => {
    const neqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ neq: neqMock });
    mockFrom.mockReturnValue({ delete: deleteMock, select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [] }) });

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Удалить все данные'));
    fireEvent.click(screen.getByText('Да, удалить всё'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockFrom).toHaveBeenCalledWith('weight');
      expect(mockFrom).toHaveBeenCalledWith('water_intake');
    });
  });

  it('deleteAll_ShouldShowSuccess_AfterDeletion', async () => {
    const neqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ neq: neqMock });
    mockFrom.mockReturnValue({ delete: deleteMock, select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [] }) });

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'ru' });
    fireEvent.click(screen.getByText('Удалить все данные'));
    fireEvent.click(screen.getByText('Да, удалить всё'));

    await waitFor(() => {
      expect(screen.getByText('Все данные удалены')).toBeDefined();
    });
  });

  it('exportMeals_ShouldFetchAndDownloadCsv_WhenExportClicked', async () => {
    const meals = [
      {
        id: 'm1',
        created_at: '2026-06-25T08:00:00Z',
        eaten_at: '2026-06-25T08:00:00Z',
        name: 'Oatmeal',
        meal_type: 'breakfast',
        calories: 350,
        protein: 12,
        fat: 6,
        carbs: 60,
        notes: null,
      },
    ];
    const orderMock = vi.fn().mockResolvedValue({ data: meals });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: orderMock,
      delete: vi.fn().mockReturnThis(),
      neq: vi.fn().mockResolvedValue({ error: null }),
    });

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    fireEvent.click(screen.getByText('Export meals (CSV)'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(orderMock).toHaveBeenCalledWith('eaten_at', { ascending: true });
      expect(exportMealsCsv).toHaveBeenCalledWith(meals);
    });
  });

  it('exportWeight_ShouldFetchAndDownloadCsv_WhenExportClicked', async () => {
    const weights = [{ id: 'w1', created_at: '2026-06-25T08:00:00Z', value: 72.5 }];
    const orderMock = vi.fn().mockResolvedValue({ data: weights });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'weight') {
        return {
          select: vi.fn().mockReturnThis(),
          order: orderMock,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        delete: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    fireEvent.click(screen.getByText('Export weight (CSV)'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('weight');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(exportWeightCsv).toHaveBeenCalledWith(weights);
    });
  });

  it('importMeals_ShouldInsertRows_WhenValidCsvSelected', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'meals') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [] }),
          insert: insertMock,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        delete: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    const csv = [
      MEALS_CSV_HEADER.join(','),
      '2026-06-25,08:00,Oatmeal,breakfast,350,12,6,60,',
    ].join('\n');
    const file = new File([csv], 'meals.csv', { type: 'text/csv' });

    const { container } = renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    const input = container.querySelector('input[type="file"][accept=".csv,text/csv"]') as HTMLInputElement;

    setFileInputFiles(input, [file]);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Oatmeal',
          meal_type: 'breakfast',
          calories: 350,
        }),
      ]);
      expect(screen.getByText('Imported 1 records')).toBeDefined();
    });
  });

  it('importMeals_ShouldShowError_WhenCsvInvalid', async () => {
    const insertMock = vi.fn();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      insert: insertMock,
      delete: vi.fn().mockReturnThis(),
      neq: vi.fn().mockResolvedValue({ error: null }),
    });

    const file = new File(['bad,header\n1,2'], 'meals.csv', { type: 'text/csv' });

    const { container } = renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    const input = container.querySelector('input[type="file"][accept=".csv,text/csv"]') as HTMLInputElement;

    setFileInputFiles(input, [file]);

    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
      expect(
        screen.getByText('Invalid CSV file. Use a file exported from NoviFood.'),
      ).toBeDefined();
    });
  });

  it('importWeight_ShouldInsertRows_WhenValidCsvSelected', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'weight') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [] }),
          insert: insertMock,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        delete: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    const csv = [WEIGHT_CSV_HEADER.join(','), '2026-06-25,08:00,72.5'].join('\n');
    const file = new File([csv], 'weight.csv', { type: 'text/csv' });

    const { container } = renderWithProviders(<SettingsClient settings={settings} />, { lang: 'en' });
    const inputs = container.querySelectorAll('input[type="file"][accept=".csv,text/csv"]');
    const weightInput = inputs[1] as HTMLInputElement;

    setFileInputFiles(weightInput, [file]);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({ value: 72.5 }),
      ]);
      expect(screen.getByText('Imported 1 records')).toBeDefined();
    });
  });
});
