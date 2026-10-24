import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeeklyChallenge } from '../types/cocktail';

const CHALLENGE_POOL = [
  { title: 'Tropical Week', description: 'Try a tropical cocktail this week', cocktailName: 'Mai Tai' },
  { title: 'Classic Hour', description: 'Make a timeless classic', cocktailName: 'Old Fashioned' },
  { title: 'Citrus Burst', description: 'Discover a citrus-forward cocktail', cocktailName: 'Daiquiri' },
  { title: 'Shaken, Not Stirred', description: 'Try a shaken cocktail', cocktailName: 'Martini' },
  { title: 'Sweet Escape', description: 'Explore a sweet cocktail', cocktailName: 'Pina Colada' },
  { title: 'Bitter Beauty', description: 'Try something with bitters', cocktailName: 'Negroni' },
  { title: 'Fizzy Fun', description: 'Make a sparkling cocktail', cocktailName: 'Mojito' },
  { title: 'Creamy Dream', description: 'Try a creamy cocktail', cocktailName: 'White Russian' },
  { title: 'Smoky Vibes', description: 'Discover a smoky drink', cocktailName: 'Whiskey Sour' },
  { title: 'Berry Blast', description: 'Make a berry cocktail', cocktailName: 'Cosmopolitan' },
  { title: 'Coffee Kick', description: 'Try a coffee cocktail', cocktailName: 'Espresso Martini' },
  { title: 'Island Breeze', description: 'Escape to the islands', cocktailName: 'Blue Lagoon' },
];

/** "Piña Colada " and "pina colada" should match. */
function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0).getTime();
}

interface ChallengeState {
  current: WeeklyChallenge | null;
  completedCount: number;
  ensureCurrentChallenge: () => void;
  completeChallenge: () => void;
  /** Completes this week's challenge if `cocktailName` is its cocktail. Returns true when it did. */
  completeIfMatches: (cocktailName: string) => boolean;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      current: null,
      completedCount: 0,
      ensureCurrentChallenge: () => {
        const weekStart = getWeekStart();
        const { current } = get();
        if (current && current.weekStart === weekStart) return;
        const idx = Math.floor(weekStart / 604800000) % CHALLENGE_POOL.length;
        const template = CHALLENGE_POOL[idx];
        set({
          current: {
            id: weekStart.toString(),
            title: template.title,
            description: template.description,
            cocktailName: template.cocktailName,
            weekStart,
            completed: false,
          },
        });
      },
      completeChallenge: () =>
        set((state) =>
          !state.current || state.current.completed
            ? state
            : {
                current: { ...state.current, completed: true },
                completedCount: state.completedCount + 1,
              },
        ),
      completeIfMatches: (cocktailName) => {
        const { current, completeChallenge } = get();
        if (!current || current.completed) return false;
        if (normalizeName(current.cocktailName) !== normalizeName(cocktailName)) return false;
        completeChallenge();
        return true;
      },
    }),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
