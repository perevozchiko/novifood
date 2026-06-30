/*
  CSV export utilities.

  Runs entirely client-side — no server roundtrip needed.
  Triggers a browser file download via a temporary <a> element.
*/

import type { Meal, Weight } from '@/types';

export const MEALS_CSV_HEADER = [
  'Date',
  'Time',
  'Name',
  'Type',
  'Calories',
  'Protein (g)',
  'Fat (g)',
  'Carbs (g)',
  'Notes',
] as const;

export const WEIGHT_CSV_HEADER = ['Date', 'Time', 'Weight (kg)'] as const;

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains commas, newlines, or quotes.
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* Export meal diary to CSV. */
export function exportMealsCsv(meals: Meal[]): void {
  const rows: string[][] = [[...MEALS_CSV_HEADER]];

  for (const m of meals) {
    const dt = new Date(m.eaten_at);
    rows.push([
      dt.toISOString().slice(0, 10),
      dt.toTimeString().slice(0, 5),
      m.name,
      m.meal_type ?? '',
      String(m.calories),
      String(m.protein),
      String(m.fat),
      String(m.carbs),
      m.notes ?? '',
    ]);
  }

  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`novifood-meals-${today}.csv`, rows);
}

/* Export weight log to CSV. */
export function exportWeightCsv(history: Weight[]): void {
  const rows: string[][] = [[...WEIGHT_CSV_HEADER]];

  for (const w of history) {
    const dt = new Date(w.created_at);
    rows.push([
      dt.toISOString().slice(0, 10),
      dt.toTimeString().slice(0, 5),
      String(w.value),
    ]);
  }

  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`novifood-weight-${today}.csv`, rows);
}
