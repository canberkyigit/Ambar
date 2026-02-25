import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { useShoppingListStore } from '../../src/stores/useShoppingListStore';
import { cocktailService } from '../../src/services/cocktailService';
import { shareCocktail } from '../../src/utils/share';
import { extractIngredients } from '../../src/types/cocktail';
import { scaleIngredients } from '../../src/utils/scaleMeasure';
import { typography, spacing, borderRadius } from '../../src/theme';
import { AlcoholInfo } from '../../src/components/cocktail/AlcoholInfo';
import { BACEstimator } from '../../src/components/cocktail/BACEstimator';
import { PartyMode } from '../../src/components/cocktail/PartyMode';
import { SubstitutionTip } from '../../src/components/cocktail/SubstitutionTip';
import type { Cocktail } from '../../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 400;

export default function CocktailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { setFilterCocktailName } = useBarsStore();
  const { addFromCocktail } = useShoppingListStore();

  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    if (id) {
      cocktailService.getById(id).then(setCocktail).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!cocktail) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Cocktail not found</Text>
      </View>
    );
  }

  const ingredients = extractIngredients(cocktail);
  const scaledIngredients = scaleIngredients(ingredients, servings);
  const favorite = isFavorite(cocktail.idDrink);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: cocktail.strDrinkThumb }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', theme.background]}
            locations={[0, 0.35, 1]}
            style={styles.heroGradient}
          />
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
            <Pressable onPress={() => router.back()} style={styles.topBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>
            <View style={styles.topActions}>
              <Pressable onPress={() => shareCocktail(cocktail)} style={styles.topBtn} hitSlop={12}>
                <Ionicons name="share-outline" size={20} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite({ idDrink: cocktail.idDrink, strDrink: cocktail.strDrink, strDrinkThumb: cocktail.strDrinkThumb })}
                style={styles.topBtn}
                hitSlop={12}
              >
                <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? '#EF4444' : '#FFF'} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: theme.accent + '18' }]}>
                <Text style={[styles.badgeText, { color: theme.accent }]}>{cocktail.strCategory}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{cocktail.strAlcoholic}</Text>
              </View>
            </View>

            <Text style={[styles.name, { color: theme.text }]}>{cocktail.strDrink}</Text>

            <View style={styles.glassMeta}>
              <Ionicons name="wine-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.glassText, { color: theme.textSecondary }]}>{cocktail.strGlass}</Text>
            </View>
          </Animated.View>

          {/* Alcohol Info */}
          <AlcoholInfo ingredients={ingredients} isAlcoholic={cocktail.strAlcoholic === 'Alcoholic'} />

          {/* Servings scale */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SERVINGS</Text>
            <View style={styles.servingsRow}>
              {([1, 2, 4] as const).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setServings(n)}
                  style={[
                    styles.servingsBtn,
                    { backgroundColor: servings === n ? theme.accent : theme.surfaceSecondary },
                  ]}
                >
                  <Text style={[styles.servingsBtnText, { color: servings === n ? '#FFF' : theme.textSecondary }]}>
                    {n}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Ingredients */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>INGREDIENTS</Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {scaledIngredients.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.ingredientRow,
                    index < scaledIngredients.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={styles.ingredientLeft}>
                    <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.ingredientName, { color: theme.text }]}>{item.name}</Text>
                    <SubstitutionTip ingredientName={item.name} />
                  </View>
                  <Text style={[styles.ingredientMeasure, { color: theme.textSecondary }]}>{item.measure}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Instructions - Step by Step */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>HOW TO MAKE</Text>
            {cocktail.strInstructions
              .split(/\.\s+/)
              .filter((s) => s.trim().length > 2)
              .map((s) => (s.endsWith('.') ? s : s + '.'))
              .map((step, idx, arr) => (
                <View
                  key={idx}
                  style={[styles.stepCard, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.accent + '15' }]}>
                      <Text style={[styles.stepNumberText, { color: theme.accent }]}>{idx + 1}</Text>
                    </View>
                    {idx < arr.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <Text style={[styles.stepText, { color: theme.text }]}>{step.trim()}</Text>
                </View>
              ))}
          </Animated.View>

          {/* Tags */}
          {cocktail.strTags && (
            <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.tagsRow}>
              {cocktail.strTags.split(',').map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary }]}>#{tag.trim()}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* BAC Estimator (uses base 1x ingredients for alcohol calc) */}
          <BACEstimator ingredients={ingredients} />

          {/* Party Mode */}
          <Animated.View entering={FadeInDown.delay(360).springify()} style={{ marginBottom: spacing.md }}>
            <PartyMode ingredients={ingredients} />
          </Animated.View>

          {/* Add to shopping list */}
          <Animated.View entering={FadeInDown.delay(380).springify()} style={{ marginTop: spacing.xs }}>
            <Pressable
              onPress={() => {
                addFromCocktail(cocktail.idDrink, cocktail.strDrink, ingredients);
                router.push('/shopping-list');
              }}
              style={({ pressed }) => [
                styles.shoppingListBtn,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="cart-outline" size={20} color={theme.accent} />
              <Text style={[styles.findBarsBtnText, { color: theme.accent }]}>Add to shopping list</Text>
            </Pressable>
          </Animated.View>

          {/* Find bars that serve this */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: spacing.md }}>
            <Pressable
              onPress={() => {
                setFilterCocktailName(cocktail.strDrink);
                router.push('/(tabs)/favorites');
              }}
              style={({ pressed }) => [
                styles.findBarsBtn,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="location" size={20} color={theme.accent} />
              <Text style={[styles.findBarsBtnText, { color: theme.accent }]}>Find bars that serve this</Text>
            </Pressable>
          </Animated.View>

          {/* Step-by-Step */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/cocktail/prepare',
                  params: {
                    name: cocktail.strDrink,
                    steps: JSON.stringify(
                      cocktail.strInstructions
                        .split(/\.\s+/)
                        .filter((s) => s.trim().length > 0)
                        .map((s) => (s.endsWith('.') ? s : s + '.')),
                    ),
                    ingredients: JSON.stringify(ingredients),
                  },
                })
              }
              style={({ pressed }) => [
                styles.prepareBtn,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="restaurant" size={20} color="#FFF" />
              <Text style={styles.prepareBtnText}>Step-by-Step Preparation</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.h3 },
  heroContainer: { height: HERO_HEIGHT, width: SCREEN_WIDTH },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing['2xl'] },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  badge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: { ...typography.captionBold },
  name: { ...typography.hero },
  glassMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  glassText: { ...typography.body },
  sectionLabel: {
    ...typography.small,
    letterSpacing: 1.2,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  servingsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  servingsBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  servingsBtnText: { ...typography.bodyBold },
  card: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  ingredientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  ingredientLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ingredientName: { ...typography.body },
  ingredientMeasure: { ...typography.caption },
  stepCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    paddingRight: spacing.lg,
    marginBottom: 2,
    gap: spacing.md,
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
  },
  stepNumber: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { ...typography.captionBold },
  stepLine: {
    width: 2, flex: 1,
    marginTop: spacing.xs,
    borderRadius: 1,
  },
  stepText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tag: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: { ...typography.caption },
  shoppingListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  findBarsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  findBarsBtnText: { ...typography.bodyBold },
  prepareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
    gap: spacing.md, marginTop: spacing.xl,
  },
  prepareBtnText: { ...typography.button, color: '#FFF' },
});
