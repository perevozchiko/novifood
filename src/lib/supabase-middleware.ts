import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/*
  Creates a Supabase client inside Next.js middleware and refreshes the session.

  Refreshed auth cookies must be copied onto every response — including
  redirects — or the browser can lose the session after navigation.
*/

function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (!user && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirect = NextResponse.redirect(loginUrl);
    copyAuthCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    const redirect = NextResponse.redirect(homeUrl);
    copyAuthCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}
