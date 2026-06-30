'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useCachedQuery } from '@/hooks/useCachedQuery';

/*
  Like useCachedQuery, but waits for the Supabase session to hydrate before
  fetching and redirects to /login when the session is missing.
*/

export function useAuthenticatedQuery<T>(key: string, fetcher: () => Promise<T>) {
  const { session, isReady } = useAuth();
  const enabled = isReady && !!session;
  const query = useCachedQuery(key, fetcher, { enabled });

  useEffect(() => {
    if (isReady && !session) {
      window.location.replace('/login');
    }
  }, [isReady, session]);

  return {
    ...query,
    isLoading: !isReady || query.isLoading,
  };
}
