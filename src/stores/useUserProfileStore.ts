import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileGender = 'male' | 'female';

export interface BACProfile {
  weight: number;
  gender: ProfileGender;
}

interface UserProfileState {
  displayName: string;
  bio: string;
  avatarUri: string | null;
  /** Used by BACEstimator (weight in kg, gender for BAC calculation). */
  profile: BACProfile;
  setDisplayName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarUri: (uri: string | null) => void;
  setProfile: (updates: Partial<BACProfile>) => void;
  updateProfile: (updates: { displayName?: string; bio?: string; avatarUri?: string | null }) => void;
}

const DEFAULT_DISPLAY_NAME = 'you';
const DEFAULT_BIO = 'Exploring the world of cocktails, one sip at a time';
const DEFAULT_PROFILE: BACProfile = { weight: 70, gender: 'male' };

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      displayName: DEFAULT_DISPLAY_NAME,
      bio: DEFAULT_BIO,
      avatarUri: null,
      profile: DEFAULT_PROFILE,

      setDisplayName: (displayName) => set({ displayName: displayName.trim() || DEFAULT_DISPLAY_NAME }),
      setBio: (bio) => set({ bio: bio.trim() || DEFAULT_BIO }),
      setAvatarUri: (avatarUri) => set({ avatarUri }),

      setProfile: (updates) =>
        set((state) => ({
          profile: {
            weight: updates.weight !== undefined && updates.weight > 0 ? updates.weight : state.profile.weight,
            gender: updates.gender !== undefined ? updates.gender : state.profile.gender,
          },
        })),

      updateProfile: (updates) =>
        set((state) => ({
          displayName: updates.displayName !== undefined ? (updates.displayName.trim() || DEFAULT_DISPLAY_NAME) : state.displayName,
          bio: updates.bio !== undefined ? (updates.bio.trim() || DEFAULT_BIO) : state.bio,
          avatarUri: updates.avatarUri !== undefined ? updates.avatarUri : state.avatarUri,
        })),
    }),
    {
      name: 'user-profile-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        profile:
          persisted && typeof persisted === 'object' && persisted.profile && typeof (persisted.profile as BACProfile).weight === 'number'
            ? (persisted.profile as BACProfile)
            : DEFAULT_PROFILE,
      }),
    },
  ),
);
