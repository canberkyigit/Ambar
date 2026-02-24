import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CocktailSummary } from '../types/cocktail';

interface FavoritesState {
  favorites: CocktailSummary[];
  isFavorite: (id: string) => boolean;
  addFavorite: (cocktail: CocktailSummary) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (cocktail: CocktailSummary) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id) => get().favorites.some((f) => f.idDrink === id),
      addFavorite: (cocktail) =>
        set((state) => ({
          favorites: [cocktail, ...state.favorites],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.idDrink !== id),
        })),
      toggleFavorite: (cocktail) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(cocktail.idDrink)) {
          removeFavorite(cocktail.idDrink);
        } else {
          addFavorite(cocktail);
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
