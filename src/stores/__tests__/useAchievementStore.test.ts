import { useAchievementStore, ACHIEVEMENTS } from '../useAchievementStore';

const initial = useAchievementStore.getState();
const progressOf = (id: string) => useAchievementStore.getState().getProgress(id);

beforeEach(() => {
  useAchievementStore.setState({
    progress: ACHIEVEMENTS.map((a) => ({ id: a.id, current: 0, unlockedAt: null })),
    seen: {},
    recentUnlock: null,
  });
});

describe('useAchievementStore', () => {
  it('increments and unlocks at the target', () => {
    const { increment } = useAchievementStore.getState();
    for (let i = 0; i < 4; i++) increment('chef');
    expect(progressOf('chef').unlockedAt).toBeNull();
    increment('chef');
    expect(progressOf('chef').current).toBe(5);
    expect(progressOf('chef').unlockedAt).not.toBeNull();
    expect(useAchievementStore.getState().recentUnlock).toBe('chef');
  });

  it('setAtLeast follows real totals and never goes backwards', () => {
    const { setAtLeast } = useAchievementStore.getState();
    setAtLeast('cocktail_lover', 4);
    setAtLeast('cocktail_lover', 2);
    expect(progressOf('cocktail_lover').current).toBe(4);
    setAtLeast('cocktail_lover', 25);
    expect(progressOf('cocktail_lover').current).toBe(10);
    expect(progressOf('cocktail_lover').unlockedAt).not.toBeNull();
  });

  it('markUnique counts each key once', () => {
    const { markUnique } = useAchievementStore.getState();
    ['Cocktail', 'Shot', 'Cocktail', 'Beer'].forEach((c) => markUnique('explorer', c));
    expect(progressOf('explorer').current).toBe(3);
    expect(useAchievementStore.getState().seen.explorer).toEqual(['Cocktail', 'Shot', 'Beer']);
  });

  it('adds achievements missing from older saved progress', () => {
    useAchievementStore.setState({ progress: [] });
    useAchievementStore.getState().setAtLeast('first_sip', 1);
    expect(progressOf('first_sip').unlockedAt).not.toBeNull();
  });

  it('unlockedCount ignores ids that are no longer defined', () => {
    useAchievementStore.setState({
      progress: [
        { id: 'swipe_pro', current: 50, unlockedAt: 1 },
        { id: 'chef', current: 5, unlockedAt: 2 },
      ],
    });
    expect(useAchievementStore.getState().unlockedCount()).toBe(1);
  });

  afterAll(() => useAchievementStore.setState(initial));
});
