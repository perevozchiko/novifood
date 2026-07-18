import { supabaseBrowser } from './supabase-browser';
import type { Settings } from '@/types';

/*
  Read/write daily macro goals (browser client).

  Each authenticated user has exactly one settings row keyed by user_id.
*/

export async function getSettingsBrowser(): Promise<Settings> {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseBrowser
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  // Users created before the sign-up trigger may have no settings row yet.
  const { data: created, error: insertError } = await supabaseBrowser
    .from('settings')
    .insert({ user_id: user.id })
    .select()
    .single();

  if (!insertError && created) return created;

  const { data: existing, error: selectError } = await supabaseBrowser
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (selectError) throw insertError ?? selectError;
  return existing;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { user_id: _userId, ...fields } = updates;

  const { data, error } = await supabaseBrowser
    .from('settings')
    .update(fields)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
