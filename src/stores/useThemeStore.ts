import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, ThemeColors, colors } from '../theme';

export type ThemePreference = 'system' | ColorScheme;

interface ThemeState {
  /** What the user picked in Settings. */
  preference: ThemePreference;
  /** The scheme actually in use (resolved from the preference and the OS setting). */
  scheme: ColorScheme;
  theme: ThemeColors;
  setPreference: (preference: ThemePreference) => void;
  /** Re-resolve after the OS appearance changes. */
  syncWithSystem: () => void;
}

function resolve(preference: ThemePreference): ColorScheme {
  if (preference !== 'system') return preference;
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      scheme: resolve('system'),
      theme: colors[resolve('system')],
      setPreference: (preference) => {
        const scheme = resolve(preference);
        set({ preference, scheme, theme: colors[scheme] });
      },
      syncWithSystem: () => {
        const scheme = resolve(get().preference);
        if (scheme !== get().scheme) set({ scheme, theme: colors[scheme] });
      },
    }),
    {
      name: 'theme-storage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preference: state.preference }),
      // v0 stored only `scheme`; keep whatever the user had explicitly chosen.
      migrate: (persisted, version) => {
        const old = persisted as { scheme?: ColorScheme; preference?: ThemePreference };
        if (version === 0 && old?.scheme) return { preference: old.scheme };
        return { preference: old?.preference ?? 'system' };
      },
      merge: (persisted, current) => {
        const preference = (persisted as { preference?: ThemePreference })?.preference ?? current.preference;
        const scheme = resolve(preference);
        return { ...current, preference, scheme, theme: colors[scheme] };
      },
    }
  )
);
