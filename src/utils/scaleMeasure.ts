/**
 * Scale a measure string by a factor (e.g. "1 oz" * 2 => "2 oz").
 * Handles whole numbers, decimals, and simple fractions (1/2, 1/3, 1/4).
 * Non-numeric prefixes (e.g. "Pinch", "Some") are left unchanged.
 */
export function scaleMeasure(measure: string, factor: number): string {
  const trimmed = measure.trim();
  if (!trimmed || factor === 1) return measure;

  // Match: optional "number number/number" (e.g. "1 1/2") or "number/number" or "number" at start
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedMatch) {
    const [, whole, num, den, rest] = mixedMatch;
    const value = parseInt(whole, 10) + parseInt(num, 10) / parseInt(den, 10);
    const scaled = value * factor;
    const formatted = formatScaled(scaled);
    return formatted + (rest ? ' ' + rest.trim() : '');
  }

  const fracMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fracMatch) {
    const [, num, den, rest] = fracMatch;
    const value = parseInt(num, 10) / parseInt(den, 10);
    const scaled = value * factor;
    const formatted = formatScaled(scaled);
    return formatted + (rest ? ' ' + rest.trim() : '');
  }

  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (numMatch) {
    const [, numStr, rest] = numMatch;
    const value = parseFloat(numStr);
    const scaled = value * factor;
    const formatted = formatScaled(scaled);
    return formatted + (rest ? ' ' + rest.trim() : '');
  }

  return measure;
}

function formatScaled(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const tol = 0.01;
  if (Math.abs(n - 0.5) < tol) return '1/2';
  if (Math.abs(n - 0.25) < tol) return '1/4';
  if (Math.abs(n - 0.75) < tol) return '3/4';
  if (Math.abs(n - 1.5) < tol) return '1 1/2';
  if (Math.abs(n - 2.5) < tol) return '2 1/2';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

export function scaleIngredients<T extends { measure: string }>(
  ingredients: T[],
  factor: number
): T[] {
  if (factor === 1) return ingredients;
  return ingredients.map((i) => ({
    ...i,
    measure: scaleMeasure(i.measure, factor),
  }));
}
