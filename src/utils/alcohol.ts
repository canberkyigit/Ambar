import type { Ingredient } from '../types/cocktail';

const ALCOHOL_ABV: Record<string, number> = {
  vodka: 40, rum: 40, 'light rum': 40, 'dark rum': 40, 'white rum': 40, 'spiced rum': 35,
  gin: 40, tequila: 40, whiskey: 40, whisky: 40, bourbon: 40, scotch: 40, 'rye whiskey': 40,
  brandy: 40, cognac: 40, 'triple sec': 30, cointreau: 40, 'grand marnier': 40,
  amaretto: 28, kahlua: 20, 'coffee liqueur': 20, baileys: 17, 'irish cream': 17,
  campari: 25, aperol: 11, vermouth: 18, 'sweet vermouth': 16, 'dry vermouth': 18,
  absinthe: 65, sambuca: 42, chartreuse: 55, 'blue curacao': 25, curacao: 25,
  midori: 20, maraschino: 32, benedictine: 40, drambuie: 40, galliano: 42,
  schnapps: 20, 'peach schnapps': 20, kirsch: 40, pisco: 42, grappa: 40, sake: 15,
  wine: 12, 'red wine': 13, 'white wine': 12, champagne: 12, prosecco: 11,
  beer: 5, stout: 6, lager: 5, ale: 5,
  port: 20, sherry: 17, mead: 14, cider: 5,
};

const CALORIES_PER_ML_ALCOHOL = 5.6;
const CALORIES_PER_ML_SUGAR = 4.0;
const SUGAR_SPIRITS: Record<string, number> = {
  kahlua: 0.4, baileys: 0.2, 'irish cream': 0.2, amaretto: 0.3,
  'triple sec': 0.2, cointreau: 0.15, 'blue curacao': 0.3, midori: 0.3,
  'cream of coconut': 0.5, grenadine: 0.6, 'simple syrup': 0.6,
  'sugar syrup': 0.6, 'agave syrup': 0.6, honey: 0.8,
};

function parseMeasureToMl(measure: string): number {
  const cleaned = measure.toLowerCase().trim();
  if (!cleaned) return 30;

  const numMatch = cleaned.match(/[\d.\/]+/);
  let amount = 30;
  if (numMatch) {
    const raw = numMatch[0];
    if (raw.includes('/')) {
      const [n, d] = raw.split('/');
      amount = parseFloat(n) / parseFloat(d);
    } else {
      amount = parseFloat(raw);
    }
  }

  if (cleaned.includes('oz')) return amount * 29.57;
  if (cleaned.includes('cl')) return amount * 10;
  if (cleaned.includes('ml')) return amount;
  if (cleaned.includes('shot')) return amount * 44;
  if (cleaned.includes('jigger')) return amount * 44;
  if (cleaned.includes('cup')) return amount * 236;
  if (cleaned.includes('tbsp') || cleaned.includes('tblsp')) return amount * 15;
  if (cleaned.includes('tsp')) return amount * 5;
  if (cleaned.includes('dash')) return amount * 0.9;
  if (cleaned.includes('splash')) return amount * 5;
  if (cleaned.includes('part')) return amount * 30;

  return amount * 29.57;
}

function getABVForIngredient(name: string): number {
  const lower = name.toLowerCase().trim();
  if (ALCOHOL_ABV[lower] !== undefined) return ALCOHOL_ABV[lower];
  for (const [key, val] of Object.entries(ALCOHOL_ABV)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return 0;
}

export function estimateABV(ingredients: Ingredient[]): number {
  let totalMl = 0;
  let alcoholMl = 0;

  for (const ing of ingredients) {
    const ml = parseMeasureToMl(ing.measure);
    const abv = getABVForIngredient(ing.name);
    totalMl += ml;
    alcoholMl += ml * (abv / 100);
  }

  if (totalMl === 0) return 0;
  return (alcoholMl / totalMl) * 100;
}

export function estimateCalories(ingredients: Ingredient[]): number {
  let total = 0;
  for (const ing of ingredients) {
    const ml = parseMeasureToMl(ing.measure);
    const abv = getABVForIngredient(ing.name);
    total += ml * (abv / 100) * 0.789 * CALORIES_PER_ML_ALCOHOL;
    const lower = ing.name.toLowerCase().trim();
    const sugarRatio = SUGAR_SPIRITS[lower] || 0;
    total += ml * sugarRatio * CALORIES_PER_ML_SUGAR;
  }
  return Math.round(total);
}

export function estimateTotalAlcoholGrams(ingredients: Ingredient[]): number {
  let total = 0;
  for (const ing of ingredients) {
    const ml = parseMeasureToMl(ing.measure);
    const abv = getABVForIngredient(ing.name);
    total += ml * (abv / 100) * 0.789;
  }
  return total;
}

// Widmark formula: BAC = (alcohol_grams / (body_weight_kg * r)) - (0.015 * hours)
// r = 0.68 for males, 0.55 for females
export function calculateBAC(
  alcoholGrams: number,
  weightKg: number,
  gender: 'male' | 'female',
  drinkCount: number = 1,
  hoursSinceDrinking: number = 0
): number {
  const r = gender === 'male' ? 0.68 : 0.55;
  const totalAlcohol = alcoholGrams * drinkCount;
  const bac = (totalAlcohol / (weightKg * 1000 * r)) * 100;
  const adjusted = Math.max(0, bac - 0.015 * hoursSinceDrinking);
  return Math.round(adjusted * 100) / 100;
}

export function getBACLevel(bac: number): { label: string; color: string; description: string } {
  if (bac <= 0) return { label: 'Sober', color: '#10B981', description: 'No effects' };
  if (bac <= 0.02) return { label: 'Minimal', color: '#10B981', description: 'Slight relaxation' };
  if (bac <= 0.05) return { label: 'Light', color: '#F59E0B', description: 'Lowered inhibitions' };
  if (bac <= 0.08) return { label: 'Moderate', color: '#F97316', description: 'Impaired coordination' };
  if (bac <= 0.15) return { label: 'High', color: '#EF4444', description: 'Significant impairment' };
  return { label: 'Dangerous', color: '#DC2626', description: 'Seek medical help' };
}

export function promilFromBAC(bac: number): number {
  return Math.round(bac * 10) / 10;
}
