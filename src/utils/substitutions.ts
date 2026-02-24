const SUBSTITUTION_MAP: Record<string, string[]> = {
  'triple sec': ['Cointreau', 'Grand Marnier', 'Curaçao', 'Orange juice (non-alc)'],
  cointreau: ['Triple Sec', 'Grand Marnier', 'Orange Curaçao'],
  'grand marnier': ['Cointreau', 'Triple Sec', 'Orange juice + brandy'],
  vodka: ['White rum', 'Gin', 'Soju'],
  gin: ['Vodka', 'White rum', 'Non-alc gin'],
  rum: ['Bourbon', 'Brandy', 'Cachaça'],
  'light rum': ['White rum', 'Vodka', 'Cachaça'],
  'dark rum': ['Bourbon', 'Brandy', 'Aged rum'],
  'white rum': ['Light rum', 'Vodka', 'Cachaça'],
  tequila: ['Mezcal', 'Vodka', 'Pisco'],
  bourbon: ['Rye whiskey', 'Scotch', 'Brandy'],
  whiskey: ['Bourbon', 'Scotch', 'Rye whiskey'],
  scotch: ['Bourbon', 'Irish whiskey', 'Japanese whisky'],
  brandy: ['Cognac', 'Bourbon', 'Rum'],
  cognac: ['Brandy', 'Bourbon', 'Armagnac'],
  campari: ['Aperol (lighter)', 'Non-alc Campari', 'Cranberry + grapefruit'],
  aperol: ['Campari (stronger)', 'Non-alc aperitif'],
  'sweet vermouth': ['Dry vermouth + simple syrup', 'Port wine', 'Madeira'],
  'dry vermouth': ['White wine', 'Sake', 'Lillet Blanc'],
  vermouth: ['Dry vermouth', 'Sweet vermouth', 'White wine'],
  kahlua: ['Tia Maria', 'Mr. Black', 'Strong espresso + sugar'],
  'coffee liqueur': ['Kahlua', 'Tia Maria', 'Cold brew + simple syrup'],
  baileys: ['Any Irish cream', 'Cream + whiskey + chocolate'],
  'irish cream': ['Baileys', 'Cream + whiskey'],
  amaretto: ['Orgeat syrup', 'Almond extract + simple syrup', 'Frangelico'],
  'blue curacao': ['Triple Sec + blue food coloring', 'Curaçao'],
  grenadine: ['Pomegranate juice + sugar', 'Raspberry syrup', 'Cherry juice'],
  'simple syrup': ['Honey syrup', 'Agave nectar', 'Maple syrup', 'Sugar + water'],
  'agave syrup': ['Simple syrup', 'Honey syrup', 'Maple syrup'],
  'lime juice': ['Lemon juice', 'Yuzu juice', 'White vinegar (small amt)'],
  'lemon juice': ['Lime juice', 'Grapefruit juice', 'Vinegar (small amt)'],
  'orange juice': ['Tangerine juice', 'Mango juice', 'Pineapple juice'],
  'cranberry juice': ['Pomegranate juice', 'Cherry juice', 'Hibiscus tea'],
  'pineapple juice': ['Mango juice', 'Passion fruit juice', 'Orange juice'],
  'ginger beer': ['Ginger ale', 'Homemade ginger syrup + soda'],
  'ginger ale': ['Ginger beer (stronger)', 'Lemon-lime soda + ginger'],
  'club soda': ['Sparkling water', 'Tonic water', 'Seltzer'],
  'tonic water': ['Club soda + quinine', 'Sparkling water + lime'],
  'cream of coconut': ['Coconut milk + sugar', 'Coconut cream'],
  'egg white': ['Aquafaba (chickpea water)', 'Ms. Better\'s Bitters Miraculous Foamer'],
  angostura: ['Peychaud\'s Bitters', 'Orange bitters'],
  'angostura bitters': ['Peychaud\'s Bitters', 'Orange bitters'],
  'orange bitters': ['Angostura Bitters', 'Orange zest'],
  absinthe: ['Pernod', 'Pastis', 'Anise extract'],
  champagne: ['Prosecco', 'Cava', 'Sparkling wine'],
  prosecco: ['Champagne', 'Cava', 'Sparkling water (non-alc)'],
  maraschino: ['Cherry liqueur', 'Kirsch', 'Cherry syrup (non-alc)'],
  chartreuse: ['Genepy', 'Strega', 'Herbal liqueur'],
  'cream': ['Half-and-half', 'Coconut cream (dairy-free)', 'Oat milk'],
  'heavy cream': ['Cream', 'Coconut cream', 'Half-and-half'],
  milk: ['Oat milk', 'Almond milk', 'Coconut milk'],
};

export function getSubstitutions(ingredientName: string): string[] {
  const lower = ingredientName.toLowerCase().trim();
  if (SUBSTITUTION_MAP[lower]) return SUBSTITUTION_MAP[lower];
  for (const [key, subs] of Object.entries(SUBSTITUTION_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return subs;
  }
  return [];
}

export function hasSubstitution(ingredientName: string): boolean {
  return getSubstitutions(ingredientName).length > 0;
}
