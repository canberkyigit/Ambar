import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncRecipeAchievements } from './achievementSync';
import type { CustomRecipe } from '../types/cocktail';

interface CustomRecipeState {
  recipes: CustomRecipe[];
  addRecipe: (recipe: Omit<CustomRecipe, 'id' | 'createdAt'>) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, updates: Partial<CustomRecipe>) => void;
}

export const useCustomRecipeStore = create<CustomRecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      addRecipe: (recipe) => {
        set((state) => ({
          recipes: [
            {
              ...recipe,
              id: Date.now().toString(),
              createdAt: Date.now(),
            },
            ...state.recipes,
          ],
        }));
        syncRecipeAchievements(get().recipes.length);
      },
      removeRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),
      updateRecipe: (id, updates) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
    }),
    {
      name: 'custom-recipes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
