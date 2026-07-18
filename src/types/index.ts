export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  created_at: string;
  eaten_at: string;
  name: string;
  meal_type: MealType | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  weight_grams?: number | null;
  notes: string | null;
}

export interface Settings {
  user_id: string;
  calorie_goal: number;
  protein_goal: number;
  fat_goal: number;
  carbs_goal: number;
  water_goal_ml: number;
}

export interface Weight {
  id: string;
  created_at: string;
  value: number;
}

export interface WaterIntake {
  id: string;
  created_at: string;
  logged_at: string;
  amount_ml: number;
}

export interface ProductNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Product extends ProductNutrition {
  id: string;
  name: string;
  barcode: string | null;
  source: 'openfoodfacts' | 'manual' | 'ai';
  baseProductId: string | null;
  isPersonal: boolean;
}

export interface VoiceFoodAnalysis extends ProductNutrition {
  name: string;
  portionGrams: number;
}
