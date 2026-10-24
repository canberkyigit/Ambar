import { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/useThemeStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { useShoppingListStore } from '../../stores/useShoppingListStore';
import { useToastStore } from '../../stores/useToastStore';
import { cocktailService, prefetchCocktail } from '../../services/cocktailService';
import { shareCocktailSummary } from '../../utils/share';
import { haptics } from '../../utils/haptics';
import { extractIngredients } from '../../types/cocktail';
import { typography, spacing, borderRadius, GUTTER } from '../../theme';
import { PressableScale } from '../ui/PressableScale';
import { IconButton } from '../ui/IconButton';
import { Sheet } from '../ui/Sheet';
import type { CocktailSummary } from '../../types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - spacing.md) / 2;

interface CocktailCardProps {
  cocktail: CocktailSummary;
  /** Kept for API compatibility with existing call sites. */
  index?: number;
  size?: 'normal' | 'large';
  /** Secondary line under the name (e.g. "Uses 2 of 3"). */
  subtitle?: string;
}

/** Photo-first cocktail tile. Tap opens the recipe; long-press opens quick actions. */
export const CocktailCard = memo(function CocktailCard({
  cocktail,
  size = 'normal',
  subtitle,
}: CocktailCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  // Narrow selectors: toggling one favorite re-renders only that card, not every card on screen.
  const favorite = useFavoritesStore((s) => s.favorites.some((f) => f.idDrink === cocktail.idDrink));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addFromCocktail = useShoppingListStore((s) => s.addFromCocktail);
  const showToast = useToastStore((s) => s.show);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const cardWidth = size === 'large' ? SCREEN_WIDTH - GUTTER * 2 : CARD_WIDTH;
  const imageHeight = size === 'large' ? 220 : cardWidth * 1.1;

  const handleLongPress = useCallback(() => {
    haptics.press();
    setMenuVisible(true);
  }, []);

  const handleShare = useCallback(() => {
    setMenuVisible(false);
    shareCocktailSummary(cocktail);
  }, [cocktail]);

  const handleToggleFavorite = useCallback(() => {
    setMenuVisible(false);
    toggleFavorite(cocktail);
  }, [cocktail, toggleFavorite]);

  const handleAddToList = useCallback(async () => {
    setAddingToList(true);
    try {
      const full = await cocktailService.getById(cocktail.idDrink);
      if (full) {
        const ingredients = extractIngredients(full);
        addFromCocktail(full.idDrink, full.strDrink, ingredients);
        setMenuVisible(false);
        showToast('Ingredients added to your shopping list', 'success');
      } else {
        showToast("Couldn't load this cocktail", 'error');
      }
    } catch {
      showToast("Couldn't add to your list. Try again.", 'error');
    } finally {
      setAddingToList(false);
    }
  }, [cocktail, addFromCocktail, showToast]);

  const menu = [
    { icon: 'share-outline' as const, label: 'Share', onPress: handleShare },
    {
      icon: favorite ? ('heart' as const) : ('heart-outline' as const),
      label: favorite ? 'Remove from favorites' : 'Add to favorites',
      onPress: handleToggleFavorite,
      color: favorite ? theme.heart : undefined,
    },
    {
      icon: 'cart-outline' as const,
      label: addingToList ? 'Adding…' : 'Add ingredients to shopping list',
      onPress: handleAddToList,
      loading: addingToList,
    },
  ];

  return (
    <View style={{ width: cardWidth, marginBottom: spacing.lg }}>
      <PressableScale
        onPressIn={() => prefetchCocktail(cocktail.idDrink, cocktail.strDrinkThumb)}
        onPress={() => router.push(`/cocktail/${cocktail.idDrink}`)}
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={cocktail.strDrink}
        accessibilityHint="Long-press for more actions"
      >
        <Image cachePolicy="memory-disk" transition={120} recyclingKey={cocktail.idDrink}
          source={{ uri: `${cocktail.strDrinkThumb}/preview` }}
          style={[styles.image, { height: imageHeight, backgroundColor: theme.surface }]}
        />
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {cocktail.strDrink}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </PressableScale>
      <IconButton
        icon={favorite ? 'heart' : 'heart-outline'}
        variant="scrim"
        size={34}
        color={favorite ? theme.heart : '#FFFFFF'}
        onPress={() => toggleFavorite(cocktail)}
        accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
        style={styles.favoriteButton}
      />

      <Sheet visible={menuVisible} onClose={() => setMenuVisible(false)} title={cocktail.strDrink}>
        <View style={[styles.menu, { backgroundColor: theme.surface }]}>
          {menu.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              disabled={item.loading}
              style={({ pressed }) => [
                styles.menuItem,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                pressed && { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              {item.loading ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Ionicons name={item.icon} size={20} color={item.color ?? theme.text} />
              )}
              <Text style={[typography.body, { color: theme.text }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
});

const styles = StyleSheet.create({
  image: {
    width: '100%',
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  name: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
    paddingHorizontal: 2,
  },
  subtitle: { ...typography.caption, marginTop: 1, paddingHorizontal: 2 },
  menu: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
});
