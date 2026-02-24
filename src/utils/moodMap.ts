import type { MoodType } from '../types/cocktail';

interface MoodConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  cocktailNames: string[];
  description: string;
}

export const MOOD_MAP: Record<MoodType, MoodConfig> = {
  relaxed: {
    label: 'Relaxed',
    icon: 'leaf',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    cocktailNames: ['Mojito', 'Gin Tonic', 'Aperol Spritz', 'Paloma', 'Tom Collins'],
    description: 'Calm and easy-going drinks',
  },
  celebration: {
    label: 'Celebration',
    icon: 'sparkles',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    cocktailNames: ['Champagne Cocktail', 'French 75', 'Bellini', 'Kir Royale', 'Mimosa'],
    description: 'Bubbly and festive drinks',
  },
  romantic: {
    label: 'Romantic',
    icon: 'heart',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    cocktailNames: ['Cosmopolitan', 'French Martini', 'Rossini', 'Clover Club', 'Aviation'],
    description: 'Elegant and charming drinks',
  },
  energetic: {
    label: 'Energetic',
    icon: 'flash',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    cocktailNames: ['Espresso Martini', 'Long Island Tea', 'Tequila Sunrise', 'Dark and Stormy', 'Cuba Libre'],
    description: 'Bold and vibrant drinks',
  },
  adventurous: {
    label: 'Adventurous',
    icon: 'compass',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    cocktailNames: ['Mai Tai', 'Zombie', 'Jungle Bird', 'Painkiller', 'Planter\'s Punch'],
    description: 'Exotic and daring drinks',
  },
  cozy: {
    label: 'Cozy',
    icon: 'cafe',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.15)',
    cocktailNames: ['Irish Coffee', 'Hot Toddy', 'Old Fashioned', 'Brandy Alexander', 'White Russian'],
    description: 'Warm and comforting drinks',
  },
};

export const ALL_MOODS: MoodType[] = ['relaxed', 'celebration', 'romantic', 'energetic', 'adventurous', 'cozy'];
