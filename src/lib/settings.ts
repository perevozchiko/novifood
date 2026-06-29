import { supabaseServer } from './supabase-server';
import { supabaseBrowser } from './supabase-browser';
import type { Settings } from '@/types';

/*
  Read/write daily macro goals.

  The settings table always contains exactly one row with id = 1.
*/

/* Read the single settings row. */
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseServer
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw error;

  // water_goal_ml was added in migration 0002. Guard against databases where
  // that migration has not yet been applied so the UI never shows "undefined".
  return {
    ...data,
    water_goal_ml: data.water_goal_ml ?? 2000,
  };
}

/* Patch goal values. Returns the updated record. */
export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabaseBrowser
    .from('settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();

  if (error) throw error;
  return data;
}
