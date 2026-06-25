import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportMealsCsv, exportWeightCsv } from '@/lib/export-csv';
import type { Meal, Weight } from '@/types';

/*
  export-csv tests run in jsdom. We mock URL.createObjectURL / revokeObjectURL
  and capture the simulated anchor click to verify the CSV content.
*/

const clickMock = vi.fn();
const revokeObjectURLMock = vi.fn();
let capturedBlob: Blob | null = null;
let capturedFilename = '';

beforeEach(() => {
  clickMock.mockReset();
  revokeObjectURLMock.mockReset();
  capturedBlob = null;
  capturedFilename = '';

  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    },
    revokeObjectURL: revokeObjectURLMock,
  });

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const a = originalCreateElement('a') as HTMLAnchorElement;
      Object.defineProperty(a, 'click', { value: clickMock, writable: true });
      Object.defineProperty(a, 'download', {
        get: () => capturedFilename,
        set: (v: string) => { capturedFilename = v; },
        configurable: true,
      });
      return a;
    }
    return originalCreateElement(tag);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

const meal: Meal = {
  id: 'abc',
  created_at: '2026-06-25T08:00:00Z',
  eaten_at: '2026-06-25T08:00:00Z',
  name: 'Овсянка',
  meal_type: 'breakfast',
  calories: 350,
  protein: 12,
  fat: 6,
  carbs: 60,
  notes: null,
};

const weight: Weight = {
  id: 'w1',
  created_at: '2026-06-25T08:00:00Z',
  value: 72.5,
};

describe('exportMealsCsv', () => {
  it('exportMealsCsv_ShouldTriggerDownload', () => {
    exportMealsCsv([meal]);
    expect(clickMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();
  });

  it('exportMealsCsv_ShouldUseCorrectFilename', () => {
    exportMealsCsv([meal]);
    expect(capturedFilename).toMatch(/^novifood-meals-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportMealsCsv_ShouldIncludeHeaderRow', async () => {
    exportMealsCsv([meal]);
    const text = await blobText(capturedBlob!);
    expect(text).toContain('Date,Time,Name,Type,Calories');
  });

  it('exportMealsCsv_ShouldIncludeMealData', async () => {
    exportMealsCsv([meal]);
    const text = await blobText(capturedBlob!);
    expect(text).toContain('Овсянка');
    expect(text).toContain('breakfast');
    expect(text).toContain('350');
  });

  it('exportMealsCsv_ShouldHandleEmptyList', () => {
    exportMealsCsv([]);
    expect(clickMock).toHaveBeenCalledOnce();
  });

  it('exportMealsCsv_ShouldEscapeCommasInName', async () => {
    const m = { ...meal, name: 'Суп, курица' };
    exportMealsCsv([m]);
    const text = await blobText(capturedBlob!);
    expect(text).toContain('"Суп, курица"');
  });
});

describe('exportWeightCsv', () => {
  it('exportWeightCsv_ShouldTriggerDownload', () => {
    exportWeightCsv([weight]);
    expect(clickMock).toHaveBeenCalledOnce();
  });

  it('exportWeightCsv_ShouldUseCorrectFilename', () => {
    exportWeightCsv([weight]);
    expect(capturedFilename).toMatch(/^novifood-weight-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportWeightCsv_ShouldIncludeWeightValue', async () => {
    exportWeightCsv([weight]);
    const text = await blobText(capturedBlob!);
    expect(text).toContain('72.5');
  });

  it('exportWeightCsv_ShouldIncludeHeaderRow', async () => {
    exportWeightCsv([weight]);
    const text = await blobText(capturedBlob!);
    expect(text).toContain('Date,Time,Weight (kg)');
  });
});
