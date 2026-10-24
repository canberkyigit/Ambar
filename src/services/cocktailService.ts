import { Image } from 'expo-image';
import { api } from './api';
import { withCache, getCached, peekCached, primeCache } from './cache';
import { extractIngredients } from '../types/cocktail';
import type { Cocktail, CocktailSummary, Category, IngredientItem } from '../types/cocktail';

export interface IngredientMatch extends CocktailSummary {
  /** How many of the requested ingredients the cocktail uses. */
  matched: number;
  /** Ingredients the cocktail needs beyond the requested ones. */
  missing: number;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function normalizeIngredient(name: string) {
  return name.trim().toLowerCase();
}

const TTL_SHORT = 1000 * 60 * 30;     // 30 min
const TTL_LONG  = 1000 * 60 * 60 * 6; // 6 hours (categories, lists)

async function fetchWithFallback<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  try {
    // Long-lived reference data (letters, lists, categories) can be shown stale while it refreshes.
    return await withCache(key, fetcher, ttl, { staleWhileRevalidate: ttl >= TTL_LONG });
  } catch {
    const cached = await getCached<T>(key, true);
    if (cached !== null) return cached;
    throw new Error(`No cache and network failed for ${key}`);
  }
}

export const cocktailService = {
  async searchByName(name: string): Promise<Cocktail[]> {
    return fetchWithFallback(`search_name_${name}`, async () => {
      const { data } = await api.get('/search.php', { params: { s: name } });
      return data.drinks || [];
    }, TTL_SHORT);
  },

  async searchByFirstLetter(letter: string): Promise<Cocktail[]> {
    const drinks: Cocktail[] = await fetchWithFallback(`search_letter_${letter}`, async () => {
      const { data } = await api.get('/search.php', { params: { f: letter } });
      return data.drinks || [];
    }, TTL_LONG);
    // These are full recipes, so opening any of them later needs no network request.
    drinks.forEach((d) => primeCache(`cocktail_${d.idDrink}`, d, TTL_LONG));
    return drinks;
  },

  /** Recipe already in memory this session (list data or a prefetch), for a first-frame render. */
  peekById(id: string): Cocktail | null {
    return peekCached<Cocktail>(`cocktail_${id}`);
  },

  async getById(id: string): Promise<Cocktail | null> {
    return fetchWithFallback(`cocktail_${id}`, async () => {
      const { data } = await api.get('/lookup.php', { params: { i: id } });
      return data.drinks?.[0] || null;
    }, TTL_LONG);
  },

  async getRandom(): Promise<Cocktail | null> {
    const { data } = await api.get('/random.php');
    return data.drinks?.[0] || null;
  },

  async getByCategory(category: string): Promise<CocktailSummary[]> {
    return fetchWithFallback(`category_${category}`, async () => {
      const { data } = await api.get('/filter.php', { params: { c: category } });
      return data.drinks || [];
    }, TTL_LONG);
  },

  /** Full catalog with ingredients, assembled from the per-letter searches (cached). */
  async getAllCocktails(): Promise<Cocktail[]> {
    const all: Cocktail[] = [];
    for (let i = 0; i < ALPHABET.length; i += 6) {
      const batch = ALPHABET.slice(i, i + 6);
      const results = await Promise.all(batch.map((l) => this.searchByFirstLetter(l).catch(() => [] as Cocktail[])));
      all.push(...results.flat());
    }
    return all;
  },

  /**
   * Cocktails that use any of `ingredients`, best matches first. Matching runs locally on the
   * full catalog: the API's ingredient filter returns only one drink on the free key.
   */
  async getByIngredients(ingredients: string[]): Promise<IngredientMatch[]> {
    const wanted = new Set(ingredients.map(normalizeIngredient));
    const all = await this.getAllCocktails();
    const matches: IngredientMatch[] = [];
    for (const c of all) {
      const names = extractIngredients(c).map((i) => normalizeIngredient(i.name));
      const matched = names.filter((n) => wanted.has(n)).length;
      if (matched > 0) {
        matches.push({
          idDrink: c.idDrink,
          strDrink: c.strDrink,
          strDrinkThumb: c.strDrinkThumb,
          matched,
          missing: names.length - matched,
        });
      }
    }
    return matches.sort((a, b) => b.matched - a.matched || a.missing - b.missing || a.strDrink.localeCompare(b.strDrink));
  },

  async getByIngredient(ingredient: string): Promise<CocktailSummary[]> {
    return fetchWithFallback(`ingredient_${ingredient}`, async () => {
      const { data } = await api.get('/filter.php', { params: { i: ingredient } });
      return data.drinks || [];
    }, TTL_SHORT);
  },

  async getByAlcoholic(type: 'Alcoholic' | 'Non_Alcoholic'): Promise<CocktailSummary[]> {
    return fetchWithFallback(`alcoholic_${type}`, async () => {
      const { data } = await api.get('/filter.php', { params: { a: type } });
      return data.drinks || [];
    }, TTL_LONG);
  },

  async getCategories(): Promise<Category[]> {
    return fetchWithFallback('categories', async () => {
      const { data } = await api.get('/list.php', { params: { c: 'list' } });
      return data.drinks || [];
    }, TTL_LONG);
  },

  async getIngredientList(): Promise<IngredientItem[]> {
    return fetchWithFallback('ingredient_list', async () => {
      const { data } = await api.get('/list.php', { params: { i: 'list' } });
      return data.drinks || [];
    }, TTL_LONG);
  },

  async getGlassList(): Promise<{ strGlass: string }[]> {
    return fetchWithFallback('glass_list', async () => {
      const { data } = await api.get('/list.php', { params: { g: 'list' } });
      return data.drinks || [];
    }, TTL_LONG);
  },

  async getPopular(): Promise<Cocktail[]> {
    return fetchWithFallback('popular', async () => {
      const popularNames = ['Margarita', 'Mojito', 'Old Fashioned', 'Cosmopolitan', 'Mai Tai', 'Daiquiri'];
      const results = await Promise.all(
        popularNames.map((name) => api.get('/search.php', { params: { s: name } }))
      );
      return results
        .map((r) => r.data.drinks?.[0])
        .filter(Boolean) as Cocktail[];
    }, TTL_SHORT);
  },
};

/**
 * Warm the recipe and its full-size photo as soon as a finger lands on a cocktail, so the
 * detail screen usually has both by the time the push animation ends. Requests are shared
 * with the detail screen's own fetch (see the in-flight dedupe in cache.ts).
 */
export function prefetchCocktail(id: string, thumbUrl?: string) {
  cocktailService.getById(id).catch(() => {});
  if (thumbUrl) Image.prefetch(thumbUrl, 'memory-disk').catch(() => {});
}
