/*
  In-memory session cache for client-side tab navigation.

  Shows cached data instantly when switching tabs (like TanStack Query in
  simple-budget), then revalidates in the background.
*/

type CacheEntry<T> = { data: T; fetchedAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
