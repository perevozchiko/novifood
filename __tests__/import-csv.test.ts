import { describe, it, expect } from 'vitest';
import { MEALS_CSV_HEADER, WEIGHT_CSV_HEADER } from '@/lib/export-csv';
import {
  ImportCsvError,
  parseCsv,
  parseMealsCsv,
  parseWeightCsv,
} from '@/lib/import-csv';

function mealsCsv(...rows: string[][]): string {
  return [
    MEALS_CSV_HEADER.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

function weightCsv(...rows: string[][]): string {
  return [
    WEIGHT_CSV_HEADER.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

describe('parseCsv', () => {
  it('parseCsv_ShouldParseQuotedCommas', () => {
    const rows = parseCsv('Name,Notes\n"Суп, курица","note"');
    expect(rows[1][0]).toBe('Суп, курица');
  });

  it('parseCsv_ShouldStripBom', () => {
    const rows = parseCsv('\uFEFFDate,Time\n2026-06-25,08:00');
    expect(rows[0][0]).toBe('Date');
  });
});

describe('parseMealsCsv', () => {
  it('parseMealsCsv_ShouldParseValidRows', () => {
    const text = mealsCsv(['2026-06-25', '08:00', 'Овсянка', 'breakfast', '350', '12', '6', '60', '']);
    const rows = parseMealsCsv(text);

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Овсянка');
    expect(rows[0].meal_type).toBe('breakfast');
    expect(rows[0].calories).toBe(350);
    expect(rows[0].notes).toBeNull();
  });

  it('parseMealsCsv_ShouldParseQuotedName', () => {
    const text = mealsCsv(['2026-06-25', '08:00', '"Суп, курица"', 'lunch', '200', '10', '5', '20', '']);
    const rows = parseMealsCsv(text);
    expect(rows[0].name).toBe('Суп, курица');
  });

  it('parseMealsCsv_ShouldRejectInvalidHeader', () => {
    expect(() => parseMealsCsv('Wrong,Header\n2026-06-25,08:00,x,,0,0,0,0,')).toThrow(ImportCsvError);
  });

  it('parseMealsCsv_ShouldRejectInvalidMealType', () => {
    const text = mealsCsv(['2026-06-25', '08:00', 'Test', 'brunch', '100', '1', '1', '1', '']);
    expect(() => parseMealsCsv(text)).toThrow(ImportCsvError);
  });

  it('parseMealsCsv_ShouldReturnEmptyArray_WhenOnlyHeader', () => {
    expect(parseMealsCsv(MEALS_CSV_HEADER.join(','))).toEqual([]);
  });
});

describe('parseWeightCsv', () => {
  it('parseWeightCsv_ShouldParseValidRows', () => {
    const text = weightCsv(['2026-06-25', '08:00', '72.5']);
    const rows = parseWeightCsv(text);

    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(72.5);
    expect(rows[0].created_at).toBeTruthy();
  });

  it('parseWeightCsv_ShouldRejectInvalidHeader', () => {
    expect(() => parseWeightCsv('Date,Value\n2026-06-25,70')).toThrow(ImportCsvError);
  });

  it('parseWeightCsv_ShouldRejectInvalidWeight', () => {
    const text = weightCsv(['2026-06-25', '08:00', '-1']);
    expect(() => parseWeightCsv(text)).toThrow(ImportCsvError);
  });
});
