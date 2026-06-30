import { supabaseServer } from './supabase-server';
import { supabaseBrowser } from './supabase-browser';
import type { WaterIntake } from '@/types';

/*
  CRUD operations for daily water intake entries.

  getWaterByDate runs server-side (Server Components).
  addWaterIntake / deleteWaterIntake run client-side.
*/

/* Fetch all water entries for a specific calendar date (YYYY-MM-DD). */
export async function getWaterByDate(dateStr: string): Promise<WaterIntake[]> {
  return getWaterByDateFrom(supabaseServer, dateStr);
}

export async function getWaterByDateBrowser(dateStr: string): Promise<WaterIntake[]> {
  return getWaterByDateFrom(supabaseBrowser, dateStr);
}

async function getWaterByDateFrom(
  client: typeof supabaseServer,
  dateStr: string,
): Promise<WaterIntake[]> {
  const from = `${dateStr}T00:00:00.000Z`;
  const to = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await client
    .from('water_intake')
    .select('*')
    .gte('logged_at', from)
    .lte('logged_at', to)
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/* Insert a new water intake entry. Returns the created record. */
export async function addWaterIntake(amount_ml: number): Promise<WaterIntake> {
  const { data, error } = await supabaseBrowser
    .from('water_intake')
    .insert({ amount_ml })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* Remove a water intake entry by id. */
export async function deleteWaterIntake(id: string): Promise<void> {
  const { error } = await supabaseBrowser
    .from('water_intake')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
