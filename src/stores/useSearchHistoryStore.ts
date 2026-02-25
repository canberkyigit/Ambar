import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_HISTORY = 12;

interface SearchHistoryState {
  history: string[];
  addSearch: (term: string) => void;
  removeSearch: (term: string) => void;
  clearHistory: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      history: [],

      addSearch: (term) =>
        set((state) => {
          const cleaned = term.trim();
          if (!cleaned) return state;
          const filtered = state.history.filter((h) => h !== cleaned);
          return { history: [cleaned, ...filtered].slice(0, MAX_HISTORY) };
        }),

      removeSearch: (term) =>
        set((state) => ({
          history: state.history.filter((h) => h !== term),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'search-history-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
