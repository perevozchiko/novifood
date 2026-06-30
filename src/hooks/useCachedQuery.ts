'use client';

import { useEffect, useState } from 'react';
import { getCached, setCached } from '@/lib/client-cache';

/*
  Fetch data with stale-while-revalidate semantics.

  Returns cached data immediately on tab revisit; always refreshes in the
  background so the UI stays responsive like a SPA.
*/

export function useCachedQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(() => getCached<T>(key) ?? null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetcher()
      .then((fresh) => {
        setCached(key, fresh);
        if (!cancelled) {
          setData(fresh);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetcher]);

  return { data, error, isLoading: data === null && error === null };
}
