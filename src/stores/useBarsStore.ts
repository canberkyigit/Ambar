import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BarsState {
  /** barId -> 1..5 */
  ratings: Record<string, number>;
  /** bar IDs the user saved */
  savedBarIds: string[];
  /** When set, Bars screen filters to bars that serve this cocktail (by name) */
  filterCocktailName: string | null;
  setRating: (barId: string, stars: number) => void;
  getRating: (barId: string) => number | undefined;
  getAverageRating: (barId: string, baseRating: number, baseReviewCount: number) => { rating: number; count: number };
  toggleSavedBar: (barId: string) => void;
  isBarSaved: (barId: string) => boolean;
  setFilterCocktailName: (name: string | null) => void;
}

export const useBarsStore = create<BarsState>()(
  persist(
    (set, get) => ({
      ratings: {},
      savedBarIds: [],
      filterCocktailName: null,

      setRating: (barId, stars) =>
        set((state) => ({
          ratings: { ...state.ratings, [barId]: Math.min(5, Math.max(1, stars)) },
        })),

      getRating: (barId) => get().ratings[barId],

      getAverageRating: (barId, baseRating, baseReviewCount) => {
        const userRating = get().ratings[barId];
        if (userRating == null) {
          return { rating: baseRating, count: baseReviewCount };
        }
        const total = baseRating * baseReviewCount + userRating;
        const count = baseReviewCount + 1;
        return { rating: total / count, count };
      },

      toggleSavedBar: (barId) =>
        set((state) => ({
          savedBarIds: state.savedBarIds.includes(barId)
            ? state.savedBarIds.filter((id) => id !== barId)
            : [...state.savedBarIds, barId],
        })),

      isBarSaved: (barId) => get().savedBarIds.includes(barId),

      setFilterCocktailName: (name) => set({ filterCocktailName: name }),
    }),
    {
      name: 'bars-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
