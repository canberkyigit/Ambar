import { api } from './api';
import { withCache, getCached } from './cache';
import type { Cocktail, CocktailSummary, Category, IngredientItem } from '../types/cocktail';

const TTL_SHORT = 1000 * 60 * 30;     // 30 min
const TTL_LONG  = 1000 * 60 * 60 * 6; // 6 hours (categories, lists)

async function fetchWithFallback<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  try {
    return await withCache(key, fetcher, ttl);
  } catch {
    const cached = await getCached<T>(key);
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
    return fetchWithFallback(`search_letter_${letter}`, async () => {
      const { data } = await api.get('/search.php', { params: { f: letter } });
      return data.drinks || [];
    }, TTL_LONG);
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
