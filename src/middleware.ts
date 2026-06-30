import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
      Skip Next.js internals, static files, and the service worker.
      Auth is still enforced for API routes that touch user data.
    */
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
