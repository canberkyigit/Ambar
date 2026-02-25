import { colors, ThemeColors, ColorScheme } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, borderRadius } from './spacing';

export { colors, typography, spacing, borderRadius, fontFamilies };
export type { ThemeColors, ColorScheme };

export function getTheme(scheme: ColorScheme): ThemeColors {
  return colors[scheme];
}
