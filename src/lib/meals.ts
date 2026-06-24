import { supabaseServer } from './supabase-server';
import { supabaseBrowser } from './supabase-browser';
import type { Meal } from '@/types';

/*
  CRUD operations for meal entries.

  getMealsByDate runs server-side (Server Components).
  addMeal / updateMeal / deleteMeal run client-side (Client Components).
*/

/* Fetch all meals for a specific calendar date (YYYY-MM-DD). */
export async function getMealsByDate(dateStr: string): Promise<Meal[]> {
  const from = `${dateStr}T00:00:00.000Z`;
  const to = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabaseServer
    .from('meals')
    .select('*')
    .gte('eaten_at', from)
    .lte('eaten_at', to)
    .order('eaten_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/* Insert a new meal row. Returns the created record. */
export async function addMeal(meal: Omit<Meal, 'id' | 'created_at'>): Promise<Meal> {
  const { data, error } = await supabaseBrowser
    .from('meals')
    .insert(meal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* Patch an existing meal by id. Returns the updated record. */
export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
  const { data, error } = await supabaseBrowser
    .from('meals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* Remove a meal row by id. */
export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabaseBrowser.from('meals').delete().eq('id', id);

  if (error) throw error;
}
