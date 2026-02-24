import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_USERNAMES = [
  'cocktail_lover', 'mixmaster_jane', 'shaker_pro', 'bar_tender_life',
  'drink_explorer', 'citrus_queen', 'bourbon_boy', 'mojito_maria',
  'tiki_tom', 'martini_master', 'negroni_nina', 'daiquiri_dave',
  'spirits_sarah', 'ice_cold_ian', 'aperol_anna',
];

const CURRENT_USER = 'you';

function seedFollowData(): { followersByUser: Record<string, string[]>; followingByUser: Record<string, string[]> } {
  const followersByUser: Record<string, string[]> = {};
  const followingByUser: Record<string, string[]> = {};

  followersByUser[CURRENT_USER] = [];
  followingByUser[CURRENT_USER] = [];
  MOCK_USERNAMES.forEach((u) => {
    followersByUser[u] = [];
    followingByUser[u] = [];
  });

  // Seed so each mock user has some followers and following (from other mock users)
  MOCK_USERNAMES.forEach((username, i) => {
    const numFollowers = 3 + (i % 5);
    const numFollowing = 2 + (i % 4);
    const others = MOCK_USERNAMES.filter((x) => x !== username);

    for (let k = 0; k < numFollowers && k < others.length; k++) {
      const follower = others[(i + k * 7) % others.length];
      if (!followersByUser[username].includes(follower)) {
        followersByUser[username].push(follower);
      }
    }
    for (let k = 0; k < numFollowing && k < others.length; k++) {
      const following = others[(i + k * 3 + 1) % others.length];
      if (!followingByUser[username].includes(following)) {
        followingByUser[username].push(following);
      }
    }
  });

  return { followersByUser, followingByUser };
}

interface FollowState {
  followersByUser: Record<string, string[]>;
  followingByUser: Record<string, string[]>;
  follow: (username: string) => void;
  unfollow: (username: string) => void;
  isFollowing: (username: string) => boolean;
  getFollowersCount: (username: string) => number;
  getFollowingCount: (username: string) => number;
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => {
      const seed = seedFollowData();
      return {
        followersByUser: seed.followersByUser,
        followingByUser: seed.followingByUser,

        follow: (username) =>
          set((state) => {
            const currentFollowing = state.followingByUser[CURRENT_USER] ?? [];
            if (currentFollowing.includes(username)) return state;
            const currentFollowers = state.followersByUser[username] ?? [];
            if (currentFollowers.includes(CURRENT_USER)) return state;

            return {
              followingByUser: {
                ...state.followingByUser,
                [CURRENT_USER]: [...currentFollowing, username],
              },
              followersByUser: {
                ...state.followersByUser,
                [username]: [...currentFollowers, CURRENT_USER],
              },
            };
          }),

        unfollow: (username) =>
          set((state) => ({
            followingByUser: {
              ...state.followingByUser,
              [CURRENT_USER]: (state.followingByUser[CURRENT_USER] ?? []).filter((u) => u !== username),
            },
            followersByUser: {
              ...state.followersByUser,
              [username]: (state.followersByUser[username] ?? []).filter((u) => u !== CURRENT_USER),
            },
          })),

        isFollowing: (username) => {
          const list = get().followingByUser[CURRENT_USER] ?? [];
          return list.includes(username);
        },

        getFollowersCount: (username) => {
          const list = get().followersByUser[username] ?? [];
          return list.length;
        },

        getFollowingCount: (username) => {
          const list = get().followingByUser[username] ?? [];
          return list.length;
        },
      };
    },
    {
      name: 'follow-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
