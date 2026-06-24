import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
  Supabase client for Server Components and Route Handlers.

  Lazy-initialized so that missing env vars during `next build` (static
  page collection) do not crash the build process. At runtime the vars
  are always present via .env.local / Vercel environment settings.
*/

let _client: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars are not set');
    _client = createClient(url, key);
  }
  return _client;
}

/*
  Legacy named export. Uses a Proxy so createClient() is only called
  on first property access (i.e. at request time, not build time).
*/
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getServerClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
