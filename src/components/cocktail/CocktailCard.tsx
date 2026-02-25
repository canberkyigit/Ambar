import { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { useShoppingListStore } from '../../stores/useShoppingListStore';
import { useToastStore } from '../../stores/useToastStore';
import { cocktailService } from '../../services/cocktailService';
import { shareCocktailSummary } from '../../utils/share';
import { extractIngredients } from '../../types/cocktail';
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
  const { addFromCocktail } = useShoppingListStore();
  const showToast = useToastStore((s) => s.show);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const favorite = isFavorite(cocktail.idDrink);
  const cardWidth = size === 'large' ? SCREEN_WIDTH - spacing.lg * 2 : CARD_WIDTH;
  const imageHeight = size === 'large' ? 200 : 160;

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        showToast('Malzemeler listeye eklendi', 'success');
      } else {
        showToast('Kokteyl bilgisi alınamadı', 'error');
      }
    } catch {
      showToast('Listeye eklenirken bir hata oluştu', 'error');
    } finally {
      setAddingToList(false);
    }
  }, [cocktail, addFromCocktail]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={() => router.push(`/cocktail/${cocktail.idDrink}`)}
        onLongPress={handleLongPress}
        delayLongPress={400}
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

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={[styles.menuOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={[styles.menuSheet, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>
              {cocktail.strDrink}
            </Text>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Paylaş</Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={22}
                color={favorite ? '#EF4444' : theme.text}
              />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                {favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={handleAddToList}
              disabled={addingToList}
            >
              {addingToList ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Ionicons name="list-outline" size={22} color={theme.text} />
              )}
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                {addingToList ? 'Ekleniyor…' : 'Listeye ekle'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  menuSheet: {
    borderRadius: borderRadius.lg,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  menuTitle: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  menuItemText: {
    ...typography.body,
  },
});
