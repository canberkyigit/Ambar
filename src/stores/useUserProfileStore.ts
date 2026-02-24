import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfileState {
  displayName: string;
  bio: string;
  avatarUri: string | null;
  setDisplayName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarUri: (uri: string | null) => void;
  updateProfile: (updates: { displayName?: string; bio?: string; avatarUri?: string | null }) => void;
}

const DEFAULT_DISPLAY_NAME = 'you';
const DEFAULT_BIO = 'Exploring the world of cocktails, one sip at a time';

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      displayName: DEFAULT_DISPLAY_NAME,
      bio: DEFAULT_BIO,
      avatarUri: null,

      setDisplayName: (displayName) => set({ displayName: displayName.trim() || DEFAULT_DISPLAY_NAME }),
      setBio: (bio) => set({ bio: bio.trim() || DEFAULT_BIO }),
      setAvatarUri: (avatarUri) => set({ avatarUri }),

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
    },
  ),
);
