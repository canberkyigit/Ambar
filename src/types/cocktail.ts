export interface Cocktail {
  idDrink: string;
  strDrink: string;
  strDrinkAlternate: string | null;
  strTags: string | null;
  strCategory: string;
  strIBA: string | null;
  strAlcoholic: string;
  strGlass: string;
  strInstructions: string;
  strDrinkThumb: string;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
}

export interface CocktailSummary {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
}

export interface Ingredient {
  name: string;
  measure: string;
}

export interface Category {
  strCategory: string;
}

export interface IngredientItem {
  strIngredient1: string;
}

export interface CustomRecipe {
  id: string;
  name: string;
  image: string | null;
  category: string;
  alcoholic: boolean;
  glass: string;
  instructions: string;
  ingredients: Ingredient[];
  createdAt: number;
}

export type MoodType = 'relaxed' | 'celebration' | 'romantic' | 'energetic' | 'adventurous' | 'cozy';

export interface JournalEntry {
  id: string;
  cocktailId: string;
  cocktailName: string;
  cocktailThumb: string;
  rating: number;
  notes: string;
  photo: string | null;
  date: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
}

export interface AchievementProgress {
  id: string;
  current: number;
  unlockedAt: number | null;
}

export interface CocktailCollection {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cocktails: CocktailSummary[];
  createdAt: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  cocktailName: string;
  weekStart: number;
  completed: boolean;
}

export interface UserProfile {
  weight: number;
  gender: 'male' | 'female';
}

export interface SocialComment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface SocialPost {
  id: string;
  username: string;
  avatarColor: string;
  cocktailName: string;
  cocktailId: string;
  imageUrl: string;
  caption: string;
  likeCount: number;
  comments: SocialComment[];
  timestamp: number;
}

export function extractIngredients(cocktail: Cocktail): Ingredient[] {
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 15; i++) {
    const name = cocktail[`strIngredient${i}` as keyof Cocktail] as string | null;
    const measure = cocktail[`strMeasure${i}` as keyof Cocktail] as string | null;
    if (name && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: measure?.trim() || '',
      });
    }
  }
  return ingredients;
}
