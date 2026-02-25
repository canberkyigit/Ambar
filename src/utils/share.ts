import { Share, Platform } from 'react-native';
import type { Cocktail, CocktailSummary } from '../types/cocktail';
import { extractIngredients } from '../types/cocktail';

export async function shareCocktailSummary(cocktail: CocktailSummary): Promise<void> {
  const message = `${cocktail.strDrink}\n\n${cocktail.strDrinkThumb}\n\nShared via CocktailApp`;
  await Share.share(
    Platform.OS === 'ios'
      ? { message, url: cocktail.strDrinkThumb }
      : { message, title: cocktail.strDrink }
  );
}

export async function shareCocktail(cocktail: Cocktail): Promise<void> {
  const ingredients = extractIngredients(cocktail);
  const ingredientList = ingredients
    .map((i) => `  - ${i.measure} ${i.name}`)
    .join('\n');

  const message = `${cocktail.strDrink}\n\nCategory: ${cocktail.strCategory}\nGlass: ${cocktail.strGlass}\n\nIngredients:\n${ingredientList}\n\nInstructions:\n${cocktail.strInstructions}\n\nShared via CocktailApp`;

  await Share.share(
    Platform.OS === 'ios'
      ? { message, url: cocktail.strDrinkThumb }
      : { message, title: cocktail.strDrink }
  );
}
