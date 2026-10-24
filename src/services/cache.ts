import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cocktail_cache_';
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory layer in front of AsyncStorage: repeat reads skip disk + JSON parsing, and
// screens can read synchronously (`peekCached`) to render on the very first frame.
const memory = new Map<string, CacheEntry<unknown>>();

async function readEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  const hit = memory.get(key) as CacheEntry<T> | undefined;
  if (hit) return hit;
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    memory.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

/** Synchronous, memory-only read (fresh or stale). Returns null if not loaded this session. */
export function peekCached<T>(key: string): T | null {
  const hit = memory.get(key) as CacheEntry<T> | undefined;
  return hit ? hit.data : null;
}

/** Seed the memory layer without writing to disk (e.g. details we already have from a list). */
export function primeCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  if (!memory.has(key)) memory.set(key, { data, timestamp: Date.now(), ttl });
}

function isFresh(entry: CacheEntry<unknown>) {
  return Date.now() - entry.timestamp <= entry.ttl;
}

/**
 * Returns cached data if it is still fresh. With `allowStale`, expired data is returned too —
 * used as an offline fallback. Expired entries are kept (and overwritten on the next fetch)
 * so that fallback has something to return.
 */
export async function getCached<T>(key: string, allowStale = false): Promise<T | null> {
  const entry = await readEntry<T>(key);
  if (!entry) return null;
  return allowStale || isFresh(entry) ? entry.data : null;
}

export async function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    memory.set(key, entry);
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // silently fail
  }
}

const inFlight = new Map<string, Promise<unknown>>();

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
  { staleWhileRevalidate = false }: { staleWhileRevalidate?: boolean } = {},
): Promise<T> {
  const entry = await readEntry<T>(key);
  if (entry && isFresh(entry)) return entry.data;

  const refresh = () => {
    // Share one request between concurrent callers for the same key.
    let pending = inFlight.get(key) as Promise<T> | undefined;
    if (!pending) {
      pending = fetcher()
        .then(async (data) => {
          await setCache(key, data, ttl);
          return data;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }
    return pending;
  };

  if (entry && staleWhileRevalidate) {
    // Serve the old copy instantly; the next read gets the refreshed one.
    refresh().catch(() => {});
    return entry.data;
  }
  return refresh();
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    memory.clear();
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // silently fail
  }
}
