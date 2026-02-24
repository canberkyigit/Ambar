import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
    fontFamily,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontFamily,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    fontFamily,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    fontFamily,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    fontFamily,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    fontFamily,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0,
    fontFamily,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    fontFamily,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0,
    fontFamily,
  },
} as const;
