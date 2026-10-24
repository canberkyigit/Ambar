import { colors, ThemeColors, ColorScheme } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, borderRadius, GUTTER, TAB_BAR_CLEARANCE } from './spacing';

export { colors, typography, spacing, borderRadius, fontFamilies, GUTTER, TAB_BAR_CLEARANCE };
export type { ThemeColors, ColorScheme };

export function getTheme(scheme: ColorScheme): ThemeColors {
  return colors[scheme];
}
