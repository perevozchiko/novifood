/*
  CSV import utilities — mirror of export-csv.ts format.

  Parses NoviFood CSV backups and returns rows ready for Supabase insert.
*/

import { MEALS_CSV_HEADER, WEIGHT_CSV_HEADER } from '@/lib/export-csv';
import type { Meal, MealType, Weight } from '@/types';

const MEAL_TYPES = new Set<MealType>(['breakfast', 'lunch', 'dinner', 'snack']);

export class ImportCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportCsvError';
  }
}

export type MealImportRow = Omit<Meal, 'id' | 'created_at'>;
export type WeightImportRow = Pick<Weight, 'value' | 'created_at'>;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  return clean
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseCsvLine);
}

function headersMatch(actual: string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every((header, index) => actual[index] === header);
}

function parseLocalDateTime(date: string, time: string): string {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    throw new ImportCsvError(`Invalid date/time: ${date} ${time}`);
  }

  const dt = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  if (Number.isNaN(dt.getTime())) {
    throw new ImportCsvError(`Invalid date/time: ${date} ${time}`);
  }

  return dt.toISOString();
}

function parseInteger(value: string, field: string, rowIndex: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    throw new ImportCsvError(`Row ${rowIndex}: invalid ${field}`);
  }
  return num;
}

function parseMealType(value: string): MealType | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!MEAL_TYPES.has(trimmed as MealType)) {
    throw new ImportCsvError(`Invalid meal type: ${trimmed}`);
  }
  return trimmed as MealType;
}

/* Parse meals CSV exported by exportMealsCsv. */
export function parseMealsCsv(text: string): MealImportRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new ImportCsvError('File is empty');
  }

  const [header, ...dataRows] = rows;
  if (!headersMatch(header, MEALS_CSV_HEADER)) {
    throw new ImportCsvError('Invalid meals CSV format');
  }

  return dataRows.map((row, index) => {
    const rowIndex = index + 2;
    if (row.length < 8) {
      throw new ImportCsvError(`Row ${rowIndex}: not enough columns`);
    }

    const [date, time, name, mealType, calories, protein, fat, carbs, notes = ''] = row;
    if (!name.trim()) {
      throw new ImportCsvError(`Row ${rowIndex}: name is required`);
    }

    return {
      eaten_at: parseLocalDateTime(date, time),
      name: name.trim(),
      meal_type: parseMealType(mealType),
      calories: parseInteger(calories, 'calories', rowIndex),
      protein: parseInteger(protein, 'protein', rowIndex),
      fat: parseInteger(fat, 'fat', rowIndex),
      carbs: parseInteger(carbs, 'carbs', rowIndex),
      notes: notes.trim() ? notes : null,
    };
  });
}

/* Parse weight CSV exported by exportWeightCsv. */
export function parseWeightCsv(text: string): WeightImportRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new ImportCsvError('File is empty');
  }

  const [header, ...dataRows] = rows;
  if (!headersMatch(header, WEIGHT_CSV_HEADER)) {
    throw new ImportCsvError('Invalid weight CSV format');
  }

  return dataRows.map((row, index) => {
    const rowIndex = index + 2;
    if (row.length < 3) {
      throw new ImportCsvError(`Row ${rowIndex}: not enough columns`);
    }

    const [date, time, valueStr] = row;
    const value = Number(valueStr);
    if (!Number.isFinite(value) || value <= 0) {
      throw new ImportCsvError(`Row ${rowIndex}: invalid weight`);
    }

    return {
      value,
      created_at: parseLocalDateTime(date, time),
    };
  });
}

export async function readCsvFile(file: File): Promise<string> {
  return file.text();
}
