import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SwipeState {
  seenIds: string[];
  likedIds: string[];
  dislikedIds: string[];
  totalSwiped: number;
  markSeen: (id: string) => void;
  markLiked: (id: string) => void;
  markDisliked: (id: string) => void;
  isSeen: (id: string) => boolean;
  resetAll: () => void;
}

export const useSwipeStore = create<SwipeState>()(
  persist(
    (set, get) => ({
      seenIds: [],
      likedIds: [],
      dislikedIds: [],
      totalSwiped: 0,
      markSeen: (id) =>
        set((state) => ({
          seenIds: state.seenIds.includes(id) ? state.seenIds : [...state.seenIds, id],
        })),
      markLiked: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id) ? state.likedIds : [...state.likedIds, id],
          totalSwiped: state.totalSwiped + 1,
        })),
      markDisliked: (id) =>
        set((state) => ({
          dislikedIds: state.dislikedIds.includes(id) ? state.dislikedIds : [...state.dislikedIds, id],
          totalSwiped: state.totalSwiped + 1,
        })),
      isSeen: (id) => get().seenIds.includes(id),
      resetAll: () => set({ seenIds: [], likedIds: [], dislikedIds: [], totalSwiped: 0 }),
    }),
    {
      name: 'swipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
