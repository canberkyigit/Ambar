import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyBarState {
  ingredients: string[];
  addIngredient: (name: string) => void;
  removeIngredient: (name: string) => void;
  toggleIngredient: (name: string) => void;
  hasIngredient: (name: string) => boolean;
  clearAll: () => void;
}

export const useMyBarStore = create<MyBarState>()(
  persist(
    (set, get) => ({
      ingredients: [],
      addIngredient: (name) =>
        set((state) => ({
          ingredients: state.ingredients.includes(name)
            ? state.ingredients
            : [...state.ingredients, name],
        })),
      removeIngredient: (name) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i !== name),
        })),
      toggleIngredient: (name) => {
        const { ingredients } = get();
        if (ingredients.includes(name)) {
          set({ ingredients: ingredients.filter((i) => i !== name) });
        } else {
          set({ ingredients: [...ingredients, name] });
        }
      },
      hasIngredient: (name) =>
        get().ingredients.some(
          (i) => i.toLowerCase() === name.toLowerCase()
        ),
      clearAll: () => set({ ingredients: [] }),
    }),
    {
      name: 'my-bar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
