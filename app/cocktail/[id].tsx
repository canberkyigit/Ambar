import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { useShoppingListStore } from '../../src/stores/useShoppingListStore';
import { useToastStore } from '../../src/stores/useToastStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { cocktailService } from '../../src/services/cocktailService';
import { shareCocktail } from '../../src/utils/share';
import { extractIngredients } from '../../src/types/cocktail';
import { scaleIngredients } from '../../src/utils/scaleMeasure';
import { formatMeasure } from '../../src/utils/formatMeasure';
import { haptics } from '../../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../../src/theme';
import { AlcoholInfo } from '../../src/components/cocktail/AlcoholInfo';
import { BACEstimator } from '../../src/components/cocktail/BACEstimator';
import { SubstitutionTip } from '../../src/components/cocktail/SubstitutionTip';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { Button, IconButton, NavHeader } from '../../src/components/ui';
import type { Cocktail } from '../../src/types/cocktail';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * 1.05);
const MAX_SERVINGS = 20;

function splitSteps(instructions: string): string[] {
  return instructions
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .map((s) => (s.endsWith('.') ? s : s + '.'));
}

export default function CocktailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, theme } = useThemeStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { setFilterCocktailName } = useBarsStore();
  const { addFromCocktail } = useShoppingListStore();
  const showToast = useToastStore((s) => s.show);

  // Render immediately when the recipe is already in memory (list data / press-in prefetch).
  const [cocktail, setCocktail] = useState<Cocktail | null>(() => (id ? cocktailService.peekById(id) : null));
  const [loading, setLoading] = useState(() => cocktail === null);
  const [servings, setServings] = useState(1);
  const { increment } = useAchievementStore();
  // Count "Party Animal" progress at most once per recipe visit.
  const scaledForGroup = useRef(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  // Status bar text sits on the photo (always light) until the solid bar takes over.
  const [overHero, setOverHero] = useState(true);
  useAnimatedReaction(
    () => scrollY.value < HERO_HEIGHT - 120,
    (next, prev) => {
      if (next !== prev) runOnJS(setOverHero)(next);
    },
  );
  // Solid bar with title fades in once the hero has scrolled away.
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 160, HERO_HEIGHT - 90], [0, 1], Extrapolation.CLAMP),
  }));
  // Gentle parallax / stretch on the hero image.
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.35]) },
      { scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));

  useEffect(() => {
    if (id) {
      cocktailService
        .getById(id)
        .then((c) => {
          if (c) setCocktail(c);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Skeleton width="100%" height={HERO_HEIGHT} borderRadius={0} />
        <View style={{ padding: GUTTER, gap: spacing.md }}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="70%" height={30} />
          <Skeleton width="100%" height={64} borderRadius={borderRadius.lg} style={{ marginTop: spacing.lg }} />
          <Skeleton width="100%" height={180} borderRadius={borderRadius.lg} />
        </View>
      </View>
    );
  }

  if (!cocktail) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <NavHeader />
        <EmptyState icon="wine-outline" title="Cocktail not found" subtitle="It may have been removed, or you're offline." />
      </View>
    );
  }

  const ingredients = extractIngredients(cocktail);
  const scaledIngredients = scaleIngredients(ingredients, servings);
  const favorite = isFavorite(cocktail.idDrink);
  const isAlcoholic = cocktail.strAlcoholic === 'Alcoholic';
  const steps = splitSteps(cocktail.strInstructions);

  const handleFavorite = () => {
    haptics.success();
    toggleFavorite({ idDrink: cocktail.idDrink, strDrink: cocktail.strDrink, strDrinkThumb: cocktail.strDrinkThumb });
  };

  const handleShoppingList = () => {
    addFromCocktail(cocktail.idDrink, cocktail.strDrink, ingredients);
    haptics.success();
    showToast(`Added ${ingredients.length} ingredients to your list`, 'success');
  };

  const startMaking = () =>
    router.push({
      pathname: '/cocktail/prepare',
      params: {
        name: cocktail.strDrink,
        steps: JSON.stringify(steps),
        ingredients: JSON.stringify(scaledIngredients),
      },
    });

  const topActions = (
    <>
      <IconButton icon="share-outline" variant="scrim" size={38} onPress={() => shareCocktail(cocktail)} accessibilityLabel="Share" />
      <IconButton
        icon={favorite ? 'heart' : 'heart-outline'}
        variant="scrim"
        size={38}
        color={favorite ? theme.heart : '#FFFFFF'}
        onPress={handleFavorite}
        accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
      />
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={overHero || scheme === 'dark' ? 'light' : 'dark'} animated />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <AnimatedImage
            source={{ uri: cocktail.strDrinkThumb }}
            // Small cached thumbnail shows instantly while the full-size photo loads.
            placeholder={{ uri: `${cocktail.strDrinkThumb}/preview` }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            style={[styles.heroImage, heroStyle]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'transparent', theme.background]}
            locations={[0, 0.25, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(250)}>
            <Text style={[typography.overline, { color: theme.accent }]}>{cocktail.strCategory}</Text>
            <Text style={[styles.name, { color: theme.text }]}>{cocktail.strDrink}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="wine-outline" size={15} color={theme.textSecondary} />
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{cocktail.strGlass}</Text>
              </View>
              <Text style={{ color: theme.textTertiary }}>·</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>
                {isAlcoholic ? 'Alcoholic' : 'Alcohol-free'}
              </Text>
              <Text style={{ color: theme.textTertiary }}>·</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>
                {ingredients.length} ingredients
              </Text>
            </View>
          </Animated.View>

          <AlcoholInfo ingredients={ingredients} isAlcoholic={isAlcoholic} />

          {/* Ingredients */}
          <View style={styles.sectionHeader}>
            <Text style={[typography.h2, { color: theme.text }]}>Ingredients</Text>
            <View style={[styles.stepper, { backgroundColor: theme.surface }]}>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setServings((n) => Math.max(1, n - 1));
                }}
                disabled={servings === 1}
                hitSlop={6}
                style={styles.stepperBtn}
                accessibilityLabel="Fewer servings"
              >
                <Ionicons name="remove" size={18} color={servings === 1 ? theme.textTertiary : theme.text} />
              </Pressable>
              <Text style={[styles.stepperText, { color: theme.text }]}>
                {servings} {servings === 1 ? 'serving' : 'servings'}
              </Text>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setServings((n) => Math.min(MAX_SERVINGS, n + 1));
                  if (!scaledForGroup.current) {
                    scaledForGroup.current = true;
                    increment('party_animal');
                  }
                }}
                disabled={servings === MAX_SERVINGS}
                hitSlop={6}
                style={styles.stepperBtn}
                accessibilityLabel="More servings"
              >
                <Ionicons name="add" size={18} color={servings === MAX_SERVINGS ? theme.textTertiary : theme.text} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {scaledIngredients.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.ingredientRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                ]}
              >
                <View style={styles.ingredientLeft}>
                  <Text style={[typography.body, { color: theme.text, flexShrink: 1 }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <SubstitutionTip ingredientName={item.name} />
                </View>
                <Text style={[styles.measure, { color: theme.textSecondary }]}>
                  {item.measure ? formatMeasure(item.measure) : 'To taste'}
                </Text>
              </View>
            ))}
          </View>

          {/* Method */}
          <View style={styles.sectionHeader}>
            <Text style={[typography.h2, { color: theme.text }]}>Method</Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </Text>
          </View>
          <View style={styles.steps}>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.step}>
                <View style={[styles.stepNumber, { borderColor: theme.border }]}>
                  <Text style={[typography.captionBold, { color: theme.text }]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
              </View>
            ))}
          </View>

          {cocktail.strTags && (
            <View style={styles.tagsRow}>
              {cocktail.strTags.split(',').map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>#{tag.trim()}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Secondary actions */}
          <View style={[styles.card, styles.actionsCard, { backgroundColor: theme.surface }]}>
            {[
              { icon: 'cart-outline' as const, label: 'Add to shopping list', onPress: handleShoppingList },
              {
                icon: 'map-outline' as const,
                label: 'Find bars that serve this',
                onPress: () => {
                  setFilterCocktailName(cocktail.strDrink);
                  router.push('/(tabs)/favorites');
                },
              },
            ].map((a, i) => (
              <Pressable
                key={a.label}
                onPress={a.onPress}
                style={({ pressed }) => [
                  styles.actionRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                  pressed && { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Ionicons name={a.icon} size={20} color={theme.accent} />
                <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{a.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>

          {isAlcoholic && <BACEstimator ingredients={ingredients} />}
        </View>
      </Animated.ScrollView>

      {/* Floating controls over the hero */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]} pointerEvents="box-none">
        <IconButton icon="chevron-back" variant="scrim" size={38} onPress={() => router.back()} accessibilityLabel="Back" />
        <View style={styles.topActions}>{topActions}</View>
      </View>

      {/* Solid header that appears after scrolling past the hero */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.solidBar, { paddingTop: insets.top + spacing.xs, backgroundColor: theme.background, borderBottomColor: theme.separator }, barStyle]}
      >
        <IconButton icon="chevron-back" size={38} onPress={() => router.back()} accessibilityLabel="Back" />
        <Text style={[typography.h3, styles.solidTitle, { color: theme.text }]} numberOfLines={1}>
          {cocktail.strDrink}
        </Text>
        <View style={styles.topActions}>
          <IconButton icon="share-outline" size={38} onPress={() => shareCocktail(cocktail)} accessibilityLabel="Share" />
          <IconButton
            icon={favorite ? 'heart' : 'heart-outline'}
            size={38}
            color={favorite ? theme.heart : theme.text}
            onPress={handleFavorite}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>
      </Animated.View>

      {/* Primary action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, spacing.lg), backgroundColor: theme.background, borderTopColor: theme.separator },
        ]}
      >
        <Button title="Start making" icon="play" size="lg" fullWidth onPress={startMaking} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: HERO_HEIGHT, width: SCREEN_WIDTH, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: GUTTER,
  },
  solidBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: GUTTER, paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  solidTitle: { flex: 1, textAlign: 'center' },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  body: { paddingHorizontal: GUTTER, marginTop: -spacing['4xl'] },
  name: { ...typography.hero, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing['3xl'], marginBottom: spacing.md,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 4, height: 34 },
  stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperText: { ...typography.captionBold, minWidth: 82, textAlign: 'center', fontVariant: ['tabular-nums'] },
  card: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  ingredientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg, gap: spacing.md,
  },
  ingredientLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  measure: { ...typography.bodyBold, fontVariant: ['tabular-nums'], textAlign: 'right', maxWidth: '45%' },
  steps: { gap: spacing.lg },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { ...typography.body, flex: 1, lineHeight: 23, paddingTop: 3 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing['2xl'] },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1, borderRadius: borderRadius.full },
  actionsCard: { marginTop: spacing['3xl'] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: GUTTER, paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
