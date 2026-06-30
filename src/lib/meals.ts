import { supabaseBrowser } from './supabase-browser';
import type { Meal } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/*
  CRUD operations for meal entries (browser client).
*/

/* Fetch all meals for a specific calendar date (YYYY-MM-DD). */
export async function getMealsByDateBrowser(dateStr: string): Promise<Meal[]> {
  return getMealsByDateFrom(supabaseBrowser, dateStr);
}

async function getMealsByDateFrom(
  client: SupabaseClient,
  dateStr: string,
): Promise<Meal[]> {
  const from = `${dateStr}T00:00:00.000Z`;
  const to = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await client
    .from('meals')
    .select('*')
    .gte('eaten_at', from)
    .lte('eaten_at', to)
    .order('eaten_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/*
  Fetch all meals within an inclusive date range.

  Both `from` and `to` are YYYY-MM-DD strings.
  Used by the weekly stats page to aggregate multiple days at once.
*/
export async function getMealsByDateRangeBrowser(from: string, to: string): Promise<Meal[]> {
  return getMealsByDateRangeFrom(supabaseBrowser, from, to);
}

async function getMealsByDateRangeFrom(
  client: SupabaseClient,
  from: string,
  to: string,
): Promise<Meal[]> {
  const { data, error } = await client
    .from('meals')
    .select('*')
    .gte('eaten_at', `${from}T00:00:00.000Z`)
    .lte('eaten_at', `${to}T23:59:59.999Z`)
    .order('eaten_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/*
  Return the last `limit` distinct meal names with their most recent
  nutrition values. Used for quick-add chips in AddMealForm.

  Runs on the browser client (called from a Client Component on demand).
*/
export async function getRecentMeals(limit = 5): Promise<Meal[]> {
  const { data, error } = await supabaseBrowser
    .from('meals')
    .select('*')
    .order('eaten_at', { ascending: false })
    .limit(limit * 3); // over-fetch to deduplicate by name

  if (error) throw error;

  const seen = new Set<string>();
  const unique: Meal[] = [];
  for (const meal of data || []) {
    const key = meal.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(meal);
      if (unique.length === limit) break;
    }
  }
  return unique;
}

/*
  Pure utility: given a sorted list of ISO date strings (YYYY-MM-DD),
  count how many consecutive days ending on today have at least one entry.
*/
export function computeStreak(loggedDates: string[]): number {
  if (loggedDates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const dateSet = new Set(loggedDates);

  let streak = 0;
  let cursor = today;

  while (dateSet.has(cursor)) {
    streak++;
    const d = new Date(cursor + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }

  return streak;
}

/*
  Fetch all distinct calendar days that have at least one meal entry,
  ordered descending. Used by the streak calculation on the home page.
*/
export async function getMealDatesBrowser(): Promise<string[]> {
  return getMealDatesFrom(supabaseBrowser);
}

async function getMealDatesFrom(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from('meals')
    .select('eaten_at')
    .order('eaten_at', { ascending: false });

  if (error) throw error;

  const dateSet = new Set<string>();
  for (const row of data || []) {
    dateSet.add((row.eaten_at as string).slice(0, 10));
  }
  return Array.from(dateSet);
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
