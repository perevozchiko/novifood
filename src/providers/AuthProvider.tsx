'use client';

/*
  AuthProvider — keeps the Supabase session alive in the browser.

  Restores the session from cookies on mount and exposes readiness so client
  data hooks do not fetch before the session is hydrated (common on PWA cold
  start when middleware already passed but cookies are not read yet).
*/

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase-browser';

type AuthContextValue = {
  session: Session | null;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isReady: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();

    void supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      setIsReady(true);
      if (initial) supabase.auth.startAutoRefresh();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsReady(true);
      if (nextSession) {
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

  return (
    <AuthContext.Provider value={{ session, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
