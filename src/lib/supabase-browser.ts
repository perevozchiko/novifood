import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
  Supabase client for Client Components.

  Lazy-initialized so that missing env vars during `next build` (static
  page collection) do not crash the build process. At runtime the vars
  are always present via .env.local / Vercel environment settings.
*/

let _client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars are not set');
    _client = createClient(url, key);
  }
  return _client;
}

/*
  Legacy named export kept for backward compatibility with existing imports.
  Accessing this at module-evaluation time will throw if env vars are absent,
  so prefer getBrowserClient() in new code.
*/
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getBrowserClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
