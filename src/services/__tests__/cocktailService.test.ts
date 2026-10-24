import { cocktailService } from '../cocktailService';
import { api } from '../api';
import { clearAllCache } from '../cache';

jest.mock('../api', () => ({ api: { get: jest.fn() } }));

const drink = (id: string, name: string, ingredients: string[]) => {
  const d: Record<string, string | null> = { idDrink: id, strDrink: name, strDrinkThumb: `thumb/${id}` };
  for (let i = 1; i <= 15; i++) d[`strIngredient${i}`] = ingredients[i - 1] ?? null;
  return d;
};

const CATALOG: Record<string, ReturnType<typeof drink>[]> = {
  g: [drink('1', 'Gimlet', ['Gin', 'Lime juice', 'Sugar'])],
  m: [drink('2', 'Mojito', ['Light rum', 'Lime', 'Sugar', 'Mint', 'Soda water'])],
  n: [drink('3', 'Negroni', ['Gin', 'Campari', 'Sweet Vermouth'])],
};

beforeEach(async () => {
  await clearAllCache();
  (api.get as jest.Mock).mockImplementation(async (_url: string, { params }: { params: { f: string } }) => ({
    data: { drinks: CATALOG[params.f] ?? null },
  }));
});

describe('cocktailService.getByIngredients', () => {
  it('matches locally on the full catalog, best matches first', async () => {
    const result = await cocktailService.getByIngredients(['gin', 'Lime juice ', 'Sugar']);
    // Most requested ingredients used first, then fewest extra ingredients needed.
    expect(result.map((r) => [r.strDrink, r.matched, r.missing])).toEqual([
      ['Gimlet', 3, 0],
      ['Negroni', 1, 2],
      ['Mojito', 1, 4],
    ]);
  });

  it('makes every catalog recipe available synchronously for instant detail screens', async () => {
    expect(cocktailService.peekById('3')).toBeNull();
    await cocktailService.getAllCocktails();
    expect(cocktailService.peekById('3')?.strDrink).toBe('Negroni');
  });

  it('returns nothing when no cocktail uses the ingredients', async () => {
    await expect(cocktailService.getByIngredients(['Absinthe'])).resolves.toEqual([]);
  });
});
