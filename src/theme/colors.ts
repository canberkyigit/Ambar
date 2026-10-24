export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  /** Raised surface used for sheets, menus and modals. */
  elevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  /** Tinted background for accent-colored content (chips, icon wells). */
  accentLight: string;
  accentDark: string;
  /** Foreground color for text/icons placed on an `accent` background. */
  onAccent: string;
  border: string;
  /** Hairline separators inside lists and cards. */
  separator: string;
  card: string;
  cardShadow: string;
  tabBar: string;
  tabBarBorder: string;
  iconActive: string;
  iconInactive: string;
  success: string;
  error: string;
  warning: string;
  /** Rating stars. */
  star: string;
  /** Favorite / like heart. */
  heart: string;
  overlay: string;
  /** Translucent fill for buttons that sit on top of photos. */
  scrim: string;
  skeleton: string;
  skeletonHighlight: string;
  gradient: readonly string[];
}

export type ColorScheme = 'light' | 'dark';

// Brand: warm neutrals with an amber accent ("Ambar").
// The accent lives in `accent`/`onAccent` only — change those two to rebrand.

const light: ThemeColors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0ECE6',
  elevated: '#FFFFFF',
  text: '#1C1915',
  textSecondary: '#6B645B',
  textTertiary: '#A39B90',
  accent: '#A8650F',
  accentLight: '#F6EBDC',
  accentDark: '#7F4B09',
  onAccent: '#FFFFFF',
  border: '#E4DED5',
  separator: '#ECE7E0',
  card: '#FFFFFF',
  cardShadow: 'rgba(40, 28, 10, 0.08)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E4DED5',
  iconActive: '#A8650F',
  iconInactive: '#A39B90',
  success: '#2E9D5B',
  error: '#D93A2E',
  warning: '#D9880F',
  star: '#E3A008',
  heart: '#E5484D',
  overlay: 'rgba(20, 16, 10, 0.45)',
  scrim: 'rgba(0, 0, 0, 0.32)',
  skeleton: '#ECE7E0',
  skeletonHighlight: '#F5F2ED',
  gradient: ['#FAF8F5', '#F0ECE6'],
};

const dark: ThemeColors = {
  background: '#0D0C0A',
  surface: '#191715',
  surfaceSecondary: '#24211E',
  elevated: '#1F1C19',
  text: '#F5F1EA',
  textSecondary: '#A69F95',
  textTertiary: '#6F685F',
  accent: '#F0A93B',
  accentLight: '#2C2214',
  accentDark: '#FFC46B',
  onAccent: '#1B1206',
  border: '#2E2A26',
  separator: '#26231F',
  card: '#191715',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  tabBar: '#141210',
  tabBarBorder: '#2A2622',
  iconActive: '#F0A93B',
  iconInactive: '#6F685F',
  success: '#3DD68C',
  error: '#FF6B5E',
  warning: '#F5B544',
  star: '#F5B544',
  heart: '#FF5C61',
  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.38)',
  skeleton: '#211E1B',
  skeletonHighlight: '#2B2724',
  gradient: ['#0D0C0A', '#191715'],
};

export const colors = { light, dark } as const;
