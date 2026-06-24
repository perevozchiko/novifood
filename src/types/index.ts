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
  notes: string | null;
}

export interface Settings {
  id: 1;
  calorie_goal: number;
  protein_goal: number;
  fat_goal: number;
  carbs_goal: number;
}

export interface Weight {
  id: string;
  created_at: string;
  value: number;
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
