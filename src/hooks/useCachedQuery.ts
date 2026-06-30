'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCached, setCached } from '@/lib/client-cache';

/*
  Fetch data with stale-while-revalidate semantics.

  Returns cached data immediately on tab revisit; always refreshes in the
  background so the UI stays responsive like a SPA.
*/

type UseCachedQueryOptions = {
  /** When false, the fetch is deferred (e.g. until auth session is ready). */
  enabled?: boolean;
};

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions = {},
) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(() => (enabled ? getCached<T>(key) ?? null : null));
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const cached = getCached<T>(key);
    if (cached != null) setData(cached);
  }, [enabled, key]);

  const refetch = useCallback(() => {
    setData(null);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

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
  }, [key, fetcher, enabled, attempt]);

  return {
    data,
    error,
    isLoading: enabled && data === null && error === null,
    refetch,
  };
}
