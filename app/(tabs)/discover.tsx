import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { cocktailService, prefetchCocktail } from '../../src/services/cocktailService';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { MoodSelector } from '../../src/components/home/MoodSelector';
import { SeasonalSection } from '../../src/components/home/SeasonalSection';
import WeeklyChallenge from '../../src/components/home/WeeklyChallenge';
import { Skeleton, CocktailCardSkeleton } from '../../src/components/ui/Skeleton';
import { ScreenHeader, SectionHeader, Chip, PressableScale } from '../../src/components/ui';
import { typography, spacing, borderRadius, GUTTER, TAB_BAR_CLEARANCE } from '../../src/theme';
import type { Cocktail, Category } from '../../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH - GUTTER * 2 - 28;
const FEATURED_HEIGHT = 260;
// Text over photos always sits on a dark gradient, so it uses fixed light colors.
const ON_PHOTO_ACCENT = '#F7BD5C';

export default function DiscoverScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const markUnique = useAchievementStore((s) => s.markUnique);

  const [featured, setFeatured] = useState<Cocktail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [featuredData, categoriesData, popularData] = await Promise.all([
        Promise.all([
          cocktailService.getRandom(),
          cocktailService.getRandom(),
          cocktailService.getRandom(),
          cocktailService.getRandom(),
          cocktailService.getRandom(),
        ]),
        cocktailService.getCategories(),
        cocktailService.getPopular(),
      ]);
      const seen = new Set<string>();
      const unique = (featuredData.filter(Boolean) as Cocktail[]).filter((c) => {
        if (seen.has(c.idDrink)) return false;
        seen.add(c.idDrink);
        return true;
      });
      setFeatured(unique);
      setCategories(categoriesData.slice(0, 10));
      setPopular(popularData);
    } catch (e) {
      console.error('Failed to fetch discover data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <ScreenHeader title="Discover" subtitle="Fresh picks, every time you visit" />

      {/* Featured */}
      {loading ? (
        <View style={styles.featuredSkeleton}>
          <Skeleton width={FEATURED_CARD_WIDTH} height={FEATURED_HEIGHT} borderRadius={borderRadius.xl} />
        </View>
      ) : (
        <FlatList
          data={featured}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={FEATURED_CARD_WIDTH + spacing.md}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: GUTTER }}
          keyExtractor={(item) => item.idDrink}
          ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
          renderItem={({ item }) => (
            <PressableScale
              onPressIn={() => prefetchCocktail(item.idDrink, item.strDrinkThumb)}
              onPress={() => {
                markUnique('shake_it', item.idDrink);
                router.push(`/cocktail/${item.idDrink}`);
              }}
              activeScale={0.98}
              accessibilityRole="button"
              accessibilityLabel={item.strDrink}
            >
              <View style={[styles.featuredCard, { width: FEATURED_CARD_WIDTH, backgroundColor: theme.surface }]}>
                <Image cachePolicy="memory-disk" transition={120} source={{ uri: item.strDrinkThumb }} style={styles.featuredImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  locations={[0.35, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.featuredText}>
                  <Text style={[typography.overline, { color: ON_PHOTO_ACCENT }]}>{item.strCategory}</Text>
                  <Text style={styles.featuredName} numberOfLines={2}>{item.strDrink}</Text>
                  <View style={styles.featuredMeta}>
                    <Ionicons name="wine-outline" size={14} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.featuredGlass}>{item.strGlass}</Text>
                  </View>
                </View>
              </View>
            </PressableScale>
          )}
        />
      )}

      <View style={styles.section}>
        <WeeklyChallenge />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeader title="Categories" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width={92} height={36} borderRadius={borderRadius.full} />
              ))
            : categories.map((c) => (
                <Chip
                  key={c.strCategory}
                  label={c.strCategory}
                  onPress={() => router.push(`/category/${encodeURIComponent(c.strCategory)}`)}
                />
              ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <MoodSelector />
      </View>

      <View style={styles.section}>
        <SeasonalSection />
      </View>

      {/* Popular */}
      <View style={styles.section}>
        <SectionHeader title="Popular" />
        <View style={styles.grid}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CocktailCardSkeleton key={i} />)
            : popular.map((item) => (
                <CocktailCard
                  key={item.idDrink}
                  cocktail={{
                    idDrink: item.idDrink,
                    strDrink: item.strDrink,
                    strDrinkThumb: item.strDrinkThumb,
                  }}
                />
              ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: spacing['3xl'] },
  chips: { paddingHorizontal: GUTTER, gap: spacing.sm },
  featuredSkeleton: { paddingHorizontal: GUTTER },
  featuredCard: {
    height: FEATURED_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredText: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.xl },
  featuredName: { ...typography.h1, color: '#FFFFFF', marginTop: spacing.xs },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs },
  featuredGlass: { ...typography.caption, color: 'rgba(255,255,255,0.75)' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
  },
});
