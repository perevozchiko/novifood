import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/*
  Supabase client for Server Components and Route Handlers.

  Uses cookie-based sessions so auth state is shared with the browser client.
*/

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not set');
  return { url, key };
}

export async function getServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, key } = getEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from Server Components where cookies are read-only.
        }
      },
    },
  });
}
