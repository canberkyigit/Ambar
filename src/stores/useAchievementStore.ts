import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AchievementDef, AchievementProgress } from '../types/cocktail';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_sip', title: 'First Sip', description: 'Add your first favorite', icon: 'heart', target: 1 },
  { id: 'cocktail_lover', title: 'Cocktail Lover', description: 'Add 10 favorites', icon: 'heart-circle', target: 10 },
  { id: 'mixologist', title: 'Mixologist', description: 'Create 5 custom recipes', icon: 'flask', target: 5 },
  { id: 'explorer', title: 'Explorer', description: 'Browse 5 different categories', icon: 'compass', target: 5 },
  { id: 'world_traveler', title: 'World Traveler', description: 'Check out bars in 3 countries', icon: 'globe', target: 3 },
  { id: 'party_animal', title: 'Party Animal', description: 'Scale 3 recipes for a group', icon: 'people', target: 3 },
  { id: 'connoisseur', title: 'Connoisseur', description: 'Write 10 tasting notes', icon: 'book', target: 10 },
  { id: 'collector', title: 'Collector', description: 'Create 3 collections', icon: 'folder', target: 3 },
  { id: 'challenger', title: 'Challenger', description: 'Complete 4 weekly challenges', icon: 'trophy', target: 4 },
  { id: 'bar_master', title: 'Bar Master', description: 'Add 20 ingredients to My Bar', icon: 'wine', target: 20 },
  { id: 'shake_it', title: 'Shake It', description: 'Open 20 featured cocktails', icon: 'shuffle', target: 20 },
  { id: 'critic', title: 'Critic', description: 'Rate 5 cocktails with 5 stars', icon: 'star', target: 5 },
  { id: 'photographer', title: 'Photographer', description: 'Add 5 photos to journal', icon: 'camera', target: 5 },
  { id: 'recipe_master', title: 'Recipe Master', description: 'Create 10 custom recipes', icon: 'create', target: 10 },
  { id: 'dedicated', title: 'Dedicated', description: 'Add 50 favorites', icon: 'flame', target: 50 },
  { id: 'taste_explorer', title: 'Taste Explorer', description: 'Try all 6 moods', icon: 'color-palette', target: 6 },
  { id: 'chef', title: 'Chef', description: 'Use step-by-step prep 5 times', icon: 'restaurant', target: 5 },
];

type Progress = AchievementProgress[];

/** Moves one achievement to `next` (never backwards) and reports whether it just unlocked. */
function advance(progress: Progress, achievementId: string, next: (current: number) => number) {
  const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return { progress, unlocked: false };
  let unlocked = false;
  const updated = progress.map((p) => {
    if (p.id !== achievementId || p.unlockedAt) return p;
    const current = Math.min(Math.max(p.current, next(p.current)), def.target);
    if (current === p.current) return p;
    unlocked = current >= def.target;
    return { ...p, current, unlockedAt: unlocked ? Date.now() : null };
  });
  // Achievements added after a user's progress was persisted won't be in their list yet.
  if (!updated.some((p) => p.id === achievementId)) {
    const current = Math.min(next(0), def.target);
    unlocked = current >= def.target;
    updated.push({ id: achievementId, current, unlockedAt: unlocked ? Date.now() : null });
  }
  return { progress: updated, unlocked };
}

interface AchievementState {
  progress: AchievementProgress[];
  /** Distinct keys already counted for "N different things" achievements. */
  seen: Record<string, string[]>;
  recentUnlock: string | null;
  increment: (achievementId: string, amount?: number) => void;
  /** For count-based achievements: progress becomes at least `value` (e.g. current number of favorites). */
  setAtLeast: (achievementId: string, value: number) => void;
  /** Counts `key` once per achievement (e.g. each category browsed). */
  markUnique: (achievementId: string, key: string) => void;
  isUnlocked: (achievementId: string) => boolean;
  getProgress: (achievementId: string) => AchievementProgress;
  unlockedCount: () => number;
  dismissUnlock: () => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      progress: ACHIEVEMENTS.map((a) => ({ id: a.id, current: 0, unlockedAt: null })),
      seen: {},
      recentUnlock: null,
      increment: (achievementId, amount = 1) =>
        set((state) => {
          const { progress, unlocked } = advance(state.progress, achievementId, (c) => c + amount);
          return { progress, recentUnlock: unlocked ? achievementId : state.recentUnlock };
        }),
      setAtLeast: (achievementId, value) =>
        set((state) => {
          const { progress, unlocked } = advance(state.progress, achievementId, () => value);
          return { progress, recentUnlock: unlocked ? achievementId : state.recentUnlock };
        }),
      markUnique: (achievementId, key) =>
        set((state) => {
          const keys = state.seen[achievementId] ?? [];
          if (keys.includes(key)) return state;
          const nextKeys = [...keys, key];
          const { progress, unlocked } = advance(state.progress, achievementId, () => nextKeys.length);
          return {
            progress,
            seen: { ...state.seen, [achievementId]: nextKeys },
            recentUnlock: unlocked ? achievementId : state.recentUnlock,
          };
        }),
      isUnlocked: (achievementId) =>
        get().progress.find((p) => p.id === achievementId)?.unlockedAt != null,
      getProgress: (achievementId) =>
        get().progress.find((p) => p.id === achievementId) || { id: achievementId, current: 0, unlockedAt: null },
      unlockedCount: () =>
        get().progress.filter((p) => p.unlockedAt != null && ACHIEVEMENTS.some((a) => a.id === p.id)).length,
      dismissUnlock: () => set({ recentUnlock: null }),
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ progress: state.progress, seen: state.seen }),
    }
  )
);
