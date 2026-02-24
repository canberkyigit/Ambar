import { api } from './api';
import type { Cocktail, CocktailSummary, Category, IngredientItem } from '../types/cocktail';

export const cocktailService = {
  async searchByName(name: string): Promise<Cocktail[]> {
    const { data } = await api.get('/search.php', { params: { s: name } });
    return data.drinks || [];
  },

  async searchByFirstLetter(letter: string): Promise<Cocktail[]> {
    const { data } = await api.get('/search.php', { params: { f: letter } });
    return data.drinks || [];
  },

  async getById(id: string): Promise<Cocktail | null> {
    const { data } = await api.get('/lookup.php', { params: { i: id } });
    return data.drinks?.[0] || null;
  },

  async getRandom(): Promise<Cocktail | null> {
    const { data } = await api.get('/random.php');
    return data.drinks?.[0] || null;
  },

  async getByCategory(category: string): Promise<CocktailSummary[]> {
    const { data } = await api.get('/filter.php', { params: { c: category } });
    return data.drinks || [];
  },

  async getByIngredient(ingredient: string): Promise<CocktailSummary[]> {
    const { data } = await api.get('/filter.php', { params: { i: ingredient } });
    return data.drinks || [];
  },

  async getByAlcoholic(type: 'Alcoholic' | 'Non_Alcoholic'): Promise<CocktailSummary[]> {
    const { data } = await api.get('/filter.php', { params: { a: type } });
    return data.drinks || [];
  },

  async getCategories(): Promise<Category[]> {
    const { data } = await api.get('/list.php', { params: { c: 'list' } });
    return data.drinks || [];
  },

  async getIngredientList(): Promise<IngredientItem[]> {
    const { data } = await api.get('/list.php', { params: { i: 'list' } });
    return data.drinks || [];
  },

  async getGlassList(): Promise<{ strGlass: string }[]> {
    const { data } = await api.get('/list.php', { params: { g: 'list' } });
    return data.drinks || [];
  },

  async getPopular(): Promise<Cocktail[]> {
    const popularNames = ['Margarita', 'Mojito', 'Old Fashioned', 'Cosmopolitan', 'Mai Tai', 'Daiquiri'];
    const results = await Promise.all(
      popularNames.map((name) => api.get('/search.php', { params: { s: name } }))
    );
    return results
      .map((r) => r.data.drinks?.[0])
      .filter(Boolean) as Cocktail[];
  },
};
