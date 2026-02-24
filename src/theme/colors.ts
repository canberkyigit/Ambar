export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  border: string;
  card: string;
  cardShadow: string;
  tabBar: string;
  tabBarBorder: string;
  iconActive: string;
  iconInactive: string;
  success: string;
  error: string;
  warning: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  gradient: readonly string[];
}

export type ColorScheme = 'light' | 'dark';

const light: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceSecondary: '#E5E5EA',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#AEAEB2',
  accent: '#5E5CE6',
  accentLight: '#EEEDF9',
  accentDark: '#4B49B6',
  border: '#D1D1D6',
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.06)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  iconActive: '#5E5CE6',
  iconInactive: '#AEAEB2',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  overlay: 'rgba(0, 0, 0, 0.4)',
  skeleton: '#E5E5EA',
  skeletonHighlight: '#F2F2F7',
  gradient: ['#FFFFFF', '#F2F2F7'],
};

const dark: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  text: '#F5F5F7',
  textSecondary: '#98989D',
  textTertiary: '#636366',
  accent: '#7B7BF7',
  accentLight: '#1E1E3A',
  accentDark: '#9D9DFF',
  border: '#38383A',
  card: '#1C1C1E',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  tabBar: '#1C1C1E',
  tabBarBorder: '#38383A',
  iconActive: '#7B7BF7',
  iconInactive: '#636366',
  success: '#30D158',
  error: '#FF453A',
  warning: '#FFD60A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#2C2C2E',
  skeletonHighlight: '#38383A',
  gradient: ['#000000', '#1C1C1E'],
};

export const colors = { light, dark } as const;
