import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ingredient } from '../types/cocktail';

export interface ShoppingListItem {
  id: string;
  name: string;
  measure: string;
  cocktailName: string;
  cocktailId: string;
}

interface ShoppingListState {
  items: ShoppingListItem[];
  addFromCocktail: (cocktailId: string, cocktailName: string, ingredients: Ingredient[]) => void;
  removeItem: (id: string) => void;
  clearList: () => void;
  getListForCopy: () => string;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      items: [],

      addFromCocktail: (cocktailId, cocktailName, ingredients) =>
        set((state) => {
          const newItems: ShoppingListItem[] = ingredients.map((ing) => ({
            id: `sl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: ing.name,
            measure: ing.measure,
            cocktailName,
            cocktailId,
          }));
          return { items: [...state.items, ...newItems] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearList: () => set({ items: [] }),

      getListForCopy: () => {
        const { items } = get();
        const lines = items.map((i) => `• ${i.measure ? `${i.measure} ` : ''}${i.name} (${i.cocktailName})`);
        return lines.length ? `Shopping list\n\n${lines.join('\n')}` : 'Shopping list is empty.';
      },
    }),
    {
      name: 'shopping-list-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
