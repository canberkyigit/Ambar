import { Platform } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  fallback: systemFont,
} as const;

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
    fontFamily: fontFamilies.bold,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontFamily: fontFamilies.bold,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    fontFamily: fontFamilies.semiBold,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    fontFamily: fontFamilies.semiBold,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    fontFamily: fontFamilies.regular,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    fontFamily: fontFamilies.semiBold,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.regular,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.semiBold,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    fontFamily: fontFamilies.medium,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.semiBold,
  },
} as const;
