import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AchievementDef, AchievementProgress } from '../types/cocktail';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_sip', title: 'First Sip', description: 'Add your first favorite', icon: 'heart', target: 1 },
  { id: 'cocktail_lover', title: 'Cocktail Lover', description: 'Add 10 favorites', icon: 'heart-circle', target: 10 },
  { id: 'mixologist', title: 'Mixologist', description: 'Create 5 custom recipes', icon: 'flask', target: 5 },
  { id: 'explorer', title: 'Explorer', description: 'Browse 5 different categories', icon: 'compass', target: 5 },
  { id: 'world_traveler', title: 'World Traveler', description: 'Explore 3 regions on the map', icon: 'globe', target: 3 },
  { id: 'party_animal', title: 'Party Animal', description: 'Use Party Mode 3 times', icon: 'people', target: 3 },
  { id: 'connoisseur', title: 'Connoisseur', description: 'Write 10 tasting notes', icon: 'book', target: 10 },
  { id: 'collector', title: 'Collector', description: 'Create 3 collections', icon: 'folder', target: 3 },
  { id: 'challenger', title: 'Challenger', description: 'Complete 4 weekly challenges', icon: 'trophy', target: 4 },
  { id: 'bar_master', title: 'Bar Master', description: 'Add 20 ingredients to My Bar', icon: 'wine', target: 20 },
  { id: 'shake_it', title: 'Shake It', description: 'Discover 20 random cocktails', icon: 'shuffle', target: 20 },
  { id: 'swipe_pro', title: 'Swipe Pro', description: 'Swipe through 50 cocktails', icon: 'swap-horizontal', target: 50 },
  { id: 'critic', title: 'Critic', description: 'Rate 5 cocktails with 5 stars', icon: 'star', target: 5 },
  { id: 'photographer', title: 'Photographer', description: 'Add 5 photos to journal', icon: 'camera', target: 5 },
  { id: 'recipe_master', title: 'Recipe Master', description: 'Create 10 custom recipes', icon: 'create', target: 10 },
  { id: 'dedicated', title: 'Dedicated', description: 'Add 50 favorites', icon: 'flame', target: 50 },
  { id: 'taste_explorer', title: 'Taste Explorer', description: 'Try all 6 moods', icon: 'color-palette', target: 6 },
  { id: 'chef', title: 'Chef', description: 'Use step-by-step prep 5 times', icon: 'restaurant', target: 5 },
];

interface AchievementState {
  progress: AchievementProgress[];
  recentUnlock: string | null;
  increment: (achievementId: string, amount?: number) => void;
  isUnlocked: (achievementId: string) => boolean;
  getProgress: (achievementId: string) => AchievementProgress;
  dismissUnlock: () => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      progress: ACHIEVEMENTS.map((a) => ({ id: a.id, current: 0, unlockedAt: null })),
      recentUnlock: null,
      increment: (achievementId, amount = 1) =>
        set((state) => {
          const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
          if (!def) return state;
          const updated = state.progress.map((p) => {
            if (p.id !== achievementId || p.unlockedAt) return p;
            const newCurrent = Math.min(p.current + amount, def.target);
            const justUnlocked = newCurrent >= def.target;
            return {
              ...p,
              current: newCurrent,
              unlockedAt: justUnlocked ? Date.now() : null,
            };
          });
          const justUnlockedItem = updated.find(
            (p) => p.id === achievementId && p.unlockedAt && !state.progress.find((sp) => sp.id === achievementId)?.unlockedAt
          );
          return {
            progress: updated,
            recentUnlock: justUnlockedItem ? achievementId : state.recentUnlock,
          };
        }),
      isUnlocked: (achievementId) =>
        get().progress.find((p) => p.id === achievementId)?.unlockedAt != null,
      getProgress: (achievementId) =>
        get().progress.find((p) => p.id === achievementId) || { id: achievementId, current: 0, unlockedAt: null },
      dismissUnlock: () => set({ recentUnlock: null }),
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
