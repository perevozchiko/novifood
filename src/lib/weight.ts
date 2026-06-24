import { supabaseServer } from './supabase-server';
import { supabaseBrowser } from './supabase-browser';
import type { Weight } from '@/types';

/*
  CRUD operations for body-weight log entries.
*/

/* Fetch all weight records sorted by date ascending. */
export async function getWeightHistory(): Promise<Weight[]> {
  const { data, error } = await supabaseServer
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
