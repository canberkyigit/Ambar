type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonConfig {
  label: string;
  icon: string;
  color: string;
  cocktailNames: string[];
}

export const SEASON_MAP: Record<Season, SeasonConfig> = {
  spring: {
    label: 'Spring Picks',
    icon: 'flower',
    color: '#EC4899',
    cocktailNames: ['Aperol Spritz', 'French 75', 'Gin Fizz', 'Paloma', 'Hugo'],
  },
  summer: {
    label: 'Summer Coolers',
    icon: 'sunny',
    color: '#F59E0B',
    cocktailNames: ['Mojito', 'Pina Colada', 'Daiquiri', 'Mai Tai', 'Margarita'],
  },
  autumn: {
    label: 'Autumn Warmers',
    icon: 'leaf',
    color: '#D97706',
    cocktailNames: ['Old Fashioned', 'Manhattan', 'Whiskey Sour', 'Negroni', 'Boulevardier'],
  },
  winter: {
    label: 'Winter Classics',
    icon: 'snow',
    color: '#6366F1',
    cocktailNames: ['Irish Coffee', 'Hot Toddy', 'Eggnog', 'White Russian', 'Brandy Alexander'],
  },
};

export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function getSeasonalConfig(): SeasonConfig {
  return SEASON_MAP[getCurrentSeason()];
}
