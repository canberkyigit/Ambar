const VULGAR: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
  '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
};

/**
 * Display-only cleanup for API measures: "1 1/2 oz " → "1½ oz", "1/4 cup" → "¼ cup".
 * Keeps unknown fractions as-is and collapses stray whitespace.
 */
export function formatMeasure(measure: string): string {
  return measure
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(?:(\d+) )?\b(\d)\/(\d)\b/g, (match, whole: string | undefined, n: string, d: string) => {
      const glyph = VULGAR[`${n}/${d}`];
      if (!glyph) return match;
      return whole ? `${whole}${glyph}` : glyph;
    });
}
