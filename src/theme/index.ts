import { colors, ThemeColors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export { colors, typography, spacing, borderRadius };
export type { ThemeColors, ColorScheme };

export function getTheme(scheme: ColorScheme): ThemeColors {
  return colors[scheme];
}
