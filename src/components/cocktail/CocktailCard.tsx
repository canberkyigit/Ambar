import { memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { typography, spacing, borderRadius } from '../../theme';
import type { CocktailSummary } from '../../types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

interface CocktailCardProps {
  cocktail: CocktailSummary;
  index?: number;
  size?: 'normal' | 'large';
}

export const CocktailCard = memo(function CocktailCard({
  cocktail,
  index = 0,
  size = 'normal',
}: CocktailCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorite = isFavorite(cocktail.idDrink);
  const cardWidth = size === 'large' ? SCREEN_WIDTH - spacing.lg * 2 : CARD_WIDTH;
  const imageHeight = size === 'large' ? 200 : 160;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={() => router.push(`/cocktail/${cocktail.idDrink}`)}
        style={({ pressed }) => [
          styles.card,
          {
            width: cardWidth,
            backgroundColor: theme.card,
            shadowColor: theme.cardShadow,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Image
          source={{ uri: `${cocktail.strDrinkThumb}/preview` }}
          style={[styles.image, { height: imageHeight }]}
        />
        <Pressable
          onPress={() => toggleFavorite(cocktail)}
          style={styles.favoriteButton}
          hitSlop={12}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={favorite ? '#EF4444' : '#FFFFFF'}
          />
        </Pressable>
        <View style={styles.content}>
          <Text
            style={[styles.name, { color: theme.text }]}
            numberOfLines={1}
          >
            {cocktail.strDrink}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.bodyBold,
  },
});
