import AsyncStorage from '@react-native-async-storage/async-storage';
import { withCache, getCached, setCache, clearAllCache, peekCached, primeCache } from '../cache';

const KEY = 'test_key';
const STORAGE_KEY = 'cocktail_cache_test_key';

beforeEach(() => clearAllCache());

async function seed(data: unknown, ageMs: number, ttl: number) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() - ageMs, ttl }));
}

describe('cache', () => {
  it('returns fresh data without fetching', async () => {
    await setCache(KEY, 'cached', 60_000);
    const fetcher = jest.fn().mockResolvedValue('network');
    await expect(withCache(KEY, fetcher, 60_000)).resolves.toBe('cached');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refetches expired data by default', async () => {
    await seed('old', 10_000, 1_000);
    const fetcher = jest.fn().mockResolvedValue('new');
    await expect(withCache(KEY, fetcher, 1_000)).resolves.toBe('new');
  });

  it('serves stale data immediately and refreshes in the background', async () => {
    await seed('old', 10_000, 1_000);
    const fetcher = jest.fn().mockResolvedValue('new');
    await expect(withCache(KEY, fetcher, 1_000, { staleWhileRevalidate: true })).resolves.toBe('old');
    expect(fetcher).toHaveBeenCalledTimes(1);
    await new Promise((r) => setImmediate(r));
    await expect(getCached(KEY)).resolves.toBe('new');
  });

  it('keeps expired entries for the offline fallback', async () => {
    await seed('old', 10_000, 1_000);
    await expect(getCached(KEY)).resolves.toBeNull();
    await expect(getCached(KEY, true)).resolves.toBe('old');
  });

  it('primes and peeks the memory layer synchronously without touching disk', async () => {
    expect(peekCached(KEY)).toBeNull();
    primeCache(KEY, 'primed', 60_000);
    expect(peekCached(KEY)).toBe('primed');
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBeNull();
    await expect(withCache(KEY, jest.fn(), 60_000)).resolves.toBe('primed');
  });

  it('shares one request between concurrent callers', async () => {
    let resolve!: (v: string) => void;
    const fetcher = jest.fn(() => new Promise<string>((r) => (resolve = r)));
    const a = withCache(KEY, fetcher, 1_000);
    const b = withCache(KEY, fetcher, 1_000);
    await new Promise((r) => setImmediate(r));
    resolve('value');
    await expect(Promise.all([a, b])).resolves.toEqual(['value', 'value']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
