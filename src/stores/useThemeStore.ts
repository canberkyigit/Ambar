import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, ThemeColors, colors } from '../theme';

interface ThemeState {
  scheme: ColorScheme;
  theme: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      scheme: 'dark',
      theme: colors.dark,
      toggleTheme: () =>
        set((state) => {
          const newScheme = state.scheme === 'dark' ? 'light' : 'dark';
          return { scheme: newScheme, theme: colors[newScheme] };
        }),
      setScheme: (scheme) =>
        set({ scheme, theme: colors[scheme] }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scheme: state.scheme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = colors[state.scheme];
        }
      },
    }
  )
);
