import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalEntry } from '../types/cocktail';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  removeEntry: (id: string) => void;
  getEntriesForCocktail: (cocktailId: string) => JournalEntry[];
  averageRating: () => number;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            { ...entry, id: Date.now().toString(), date: Date.now() },
            ...state.entries,
          ],
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      getEntriesForCocktail: (cocktailId) =>
        get().entries.filter((e) => e.cocktailId === cocktailId),
      averageRating: () => {
        const { entries } = get();
        if (entries.length === 0) return 0;
        return entries.reduce((sum, e) => sum + e.rating, 0) / entries.length;
      },
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
