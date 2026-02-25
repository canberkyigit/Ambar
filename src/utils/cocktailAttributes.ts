import type { Cocktail } from '../types/cocktail';

/** Estimated attributes (0–100) and calories for filtering. Derived from ingredients/category. */
export interface CocktailAttributes {
  alcoholLevel: number; // 0 = non-alcoholic, 100 = very strong
  sweetness: number;
  sourness: number;
  bitterness: number;
  calories: number; // rough estimate
}

const SWEET_KEYWORDS = ['sugar', 'syrup', 'honey', 'liqueur', 'triple sec', 'amaretto', 'bailey', 'cream', 'sweet', 'grenadine', 'agave', 'cola', 'juice'];
const SOUR_KEYWORDS = ['lemon', 'lime', 'citrus', 'grapefruit', 'vinegar'];
const BITTER_KEYWORDS = ['bitters', 'campari', 'aperol', 'vermouth', 'quinine', 'tonic'];

function getIngredientStrings(cocktail: Cocktail): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const ing = cocktail[`strIngredient${i}` as keyof Cocktail] as string | null;
    if (ing?.trim()) out.push(ing.trim().toLowerCase());
  }
  return out;
}

export function getCocktailAttributes(cocktail: Cocktail): CocktailAttributes {
  const ingredients = getIngredientStrings(cocktail);
  const isAlcoholic = cocktail.strAlcoholic === 'Alcoholic';

  let alcoholLevel = 0;
  if (isAlcoholic) {
    const spiritCount = ingredients.filter(
      (s) =>
        s.includes('vodka') ||
        s.includes('gin') ||
        s.includes('rum') ||
        s.includes('whiskey') ||
        s.includes('tequila') ||
        s.includes('bourbon') ||
        s.includes('brandy') ||
        s.includes('liqueur')
    ).length;
    const category = (cocktail.strCategory || '').toLowerCase();
    if (category.includes('shot')) alcoholLevel = 85 + Math.min(spiritCount * 3, 15);
    else if (category.includes('cocktail')) alcoholLevel = 45 + Math.min(spiritCount * 12, 40);
    else alcoholLevel = 30 + Math.min(spiritCount * 15, 50);
    alcoholLevel = Math.min(100, alcoholLevel);
  }

  let sweetness = 0;
  for (const kw of SWEET_KEYWORDS) {
    if (ingredients.some((s) => s.includes(kw))) sweetness = Math.min(100, sweetness + 25);
  }
  if (sweetness === 0 && ingredients.some((s) => s.includes('orange') || s.includes('pineapple'))) sweetness = 15;

  let sourness = 0;
  for (const kw of SOUR_KEYWORDS) {
    if (ingredients.some((s) => s.includes(kw))) sourness = Math.min(100, sourness + 30);
  }

  let bitterness = 0;
  for (const kw of BITTER_KEYWORDS) {
    if (ingredients.some((s) => s.includes(kw))) bitterness = Math.min(100, bitterness + 35);
  }

  // Rough calories: base + alcohol + sugar
  let calories = 50;
  if (isAlcoholic) calories += 60 + alcoholLevel * 1.2;
  if (sweetness > 30) calories += 40;
  if (sweetness > 60) calories += 30;
  calories = Math.round(Math.min(500, calories));

  return {
    alcoholLevel,
    sweetness,
    sourness,
    bitterness,
    calories,
  };
}
