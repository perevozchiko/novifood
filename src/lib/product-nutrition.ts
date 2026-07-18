import type { ProductNutrition } from '@/types';

export function normalizeWeightInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const grams = Number(normalized);
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

export function nutritionForWeight(product: ProductNutrition, grams: number): ProductNutrition {
  const factor = grams / 100;
  return {
    calories: Math.round(product.calories * factor),
    protein: Math.round(product.protein * factor * 10) / 10,
    fat: Math.round(product.fat * factor * 10) / 10,
    carbs: Math.round(product.carbs * factor * 10) / 10,
  };
}

export function asNonNegativeNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}
