import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CocktailCollection, CocktailSummary } from '../types/cocktail';

const PRESET_COLLECTIONS: CocktailCollection[] = [
  { id: 'summer', name: 'Summer Vibes', description: 'Refreshing summer cocktails', emoji: '☀️', cocktails: [], createdAt: 0 },
  { id: 'date_night', name: 'Date Night', description: 'Romantic evening drinks', emoji: '🌹', cocktails: [], createdAt: 0 },
  { id: 'classic', name: 'Classics', description: 'Timeless cocktail recipes', emoji: '🥃', cocktails: [], createdAt: 0 },
  { id: 'easy', name: 'Easy to Make', description: 'Simple home cocktails', emoji: '👌', cocktails: [], createdAt: 0 },
];

interface CollectionsState {
  collections: CocktailCollection[];
  createCollection: (name: string, description: string, emoji: string) => void;
  removeCollection: (id: string) => void;
  addToCollection: (collectionId: string, cocktail: CocktailSummary) => void;
  removeFromCollection: (collectionId: string, cocktailId: string) => void;
  isInCollection: (collectionId: string, cocktailId: string) => boolean;
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: PRESET_COLLECTIONS,
      createCollection: (name, description, emoji) =>
        set((state) => ({
          collections: [
            ...state.collections,
            {
              id: Date.now().toString(),
              name,
              description,
              emoji,
              cocktails: [],
              createdAt: Date.now(),
            },
          ],
        })),
      removeCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        })),
      addToCollection: (collectionId, cocktail) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId && !c.cocktails.some((ck) => ck.idDrink === cocktail.idDrink)
              ? { ...c, cocktails: [...c.cocktails, cocktail] }
              : c
          ),
        })),
      removeFromCollection: (collectionId, cocktailId) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, cocktails: c.cocktails.filter((ck) => ck.idDrink !== cocktailId) }
              : c
          ),
        })),
      isInCollection: (collectionId, cocktailId) =>
        get().collections.find((c) => c.id === collectionId)?.cocktails.some((ck) => ck.idDrink === cocktailId) ?? false,
    }),
    {
      name: 'collections-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
