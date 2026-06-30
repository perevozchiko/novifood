import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/*
  Supabase client for Client Components.

  Uses cookie-based sessions synced with the server client via middleware.
*/

let _client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars are not set');
    _client = createBrowserClient(url, key);
  }
  return _client;
}

/*
  Legacy named export kept for backward compatibility with existing imports.
*/
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getBrowserClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
