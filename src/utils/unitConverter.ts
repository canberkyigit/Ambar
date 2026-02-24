export type Unit = 'ml' | 'oz' | 'cl' | 'dash' | 'jigger' | 'tbsp' | 'tsp' | 'cup';

const TO_ML: Record<Unit, number> = {
  ml: 1,
  oz: 29.5735,
  cl: 10,
  dash: 0.9,
  jigger: 44.3603,
  tbsp: 14.787,
  tsp: 4.929,
  cup: 236.588,
};

export const UNIT_LABELS: Record<Unit, string> = {
  ml: 'Milliliter',
  oz: 'Ounce',
  cl: 'Centiliter',
  dash: 'Dash',
  jigger: 'Jigger',
  tbsp: 'Tablespoon',
  tsp: 'Teaspoon',
  cup: 'Cup',
};

export const ALL_UNITS: Unit[] = ['ml', 'oz', 'cl', 'dash', 'jigger', 'tbsp', 'tsp', 'cup'];

export function convert(value: number, from: Unit, to: Unit): number {
  const ml = value * TO_ML[from];
  const result = ml / TO_ML[to];
  return Math.round(result * 1000) / 1000;
}

export function multiplyMeasure(measure: string, factor: number): string {
  const match = measure.match(/([\d.\/]+)\s*(.*)/);
  if (!match) return measure;
  let num: number;
  const raw = match[1];
  if (raw.includes('/')) {
    const [n, d] = raw.split('/');
    num = parseFloat(n) / parseFloat(d);
  } else {
    num = parseFloat(raw);
  }
  const result = Math.round(num * factor * 100) / 100;
  const unit = match[2].trim();
  return `${result}${unit ? ' ' + unit : ''}`;
}
