'use client';

/*
  AuthProvider — keeps the Supabase session alive in the browser.

  Restores the session from cookies on mount and refreshes tokens in the
  background so users stay signed in across page reloads and PWA updates.
*/

import { useEffect } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getBrowserClient();

    supabase.auth.getSession().catch(() => {
      // Session missing or expired — middleware will redirect to /login.
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return children;
}
