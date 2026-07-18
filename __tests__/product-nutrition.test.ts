import { describe, expect, it } from 'vitest';
import { normalizeWeightInput, nutritionForWeight } from '@/lib/product-nutrition';

describe('product nutrition helpers', () => {
  it('normalizes comma and dot weights with at most two decimals', () => {
    expect(normalizeWeightInput('0,55')).toBe(0.55);
    expect(normalizeWeightInput('0.55')).toBe(0.55);
    expect(normalizeWeightInput('125,5')).toBe(125.5);
    expect(normalizeWeightInput('1.234')).toBeNull();
    expect(normalizeWeightInput('0')).toBeNull();
  });

  it('calculates read-only serving totals from values per 100 g', () => {
    expect(nutritionForWeight({ calories: 200, protein: 10, fat: 5, carbs: 20 }, 55)).toEqual({
      calories: 110,
      protein: 5.5,
      fat: 2.8,
      carbs: 11,
    });
  });
});
