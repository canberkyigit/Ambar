import { useAchievementStore } from './useAchievementStore';

// Count-based achievements follow the real totals, so removing and re-adding can't farm them
// and progress made before an achievement existed still counts.

export function syncFavoriteAchievements(count: number) {
  const { setAtLeast } = useAchievementStore.getState();
  setAtLeast('first_sip', count);
  setAtLeast('cocktail_lover', count);
  setAtLeast('dedicated', count);
}

export function syncRecipeAchievements(count: number) {
  const { setAtLeast } = useAchievementStore.getState();
  setAtLeast('mixologist', count);
  setAtLeast('recipe_master', count);
}

/**
 * Run once at launch: after the persisted stores have loaded, bring count-based achievements
 * up to date with existing favorites/recipes.
 */
export function syncAchievementsOnLaunch(getCounts: () => { favorites: number; recipes: number }, stores: { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } }[]) {
  const all = [useAchievementStore, ...stores];
  const run = () => {
    if (!all.every((s) => s.persist.hasHydrated())) return;
    const { favorites, recipes } = getCounts();
    syncFavoriteAchievements(favorites);
    syncRecipeAchievements(recipes);
  };
  const unsubs = all.map((s) => s.persist.onFinishHydration(run));
  run();
  return () => unsubs.forEach((u) => u());
}
