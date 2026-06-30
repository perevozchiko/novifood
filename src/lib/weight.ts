import { supabaseBrowser } from './supabase-browser';
import type { Weight } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/*
  CRUD operations for body-weight log entries (browser client).
*/

export async function getWeightHistoryBrowser(): Promise<Weight[]> {
  return getWeightHistoryFrom(supabaseBrowser);
}

async function getWeightHistoryFrom(client: SupabaseClient): Promise<Weight[]> {
  const { data, error } = await client
    .from('weight')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/* Insert a new weight measurement. Returns the created record. */
export async function addWeight(value: number): Promise<Weight> {
  const { data, error } = await supabaseBrowser
    .from('weight')
    .insert({ value })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* Delete a weight record by id. */
export async function deleteWeight(id: string): Promise<void> {
  const { error } = await supabaseBrowser
    .from('weight')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
