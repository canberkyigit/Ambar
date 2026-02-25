import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { cocktailService } from '../../src/services/cocktailService';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { CategoryPill } from '../../src/components/cocktail/CategoryPill';
import { MoodSelector } from '../../src/components/home/MoodSelector';
import { SeasonalSection } from '../../src/components/home/SeasonalSection';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { Cocktail, Category } from '../../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;

export default function DiscoverScreen() {
  const router = useRouter();
  const { paddingTop: headerPadding } = useHeaderPadding();
  const { theme } = useThemeStore();

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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      {/* Header */}
      <View style={[styles.headerRow, { marginTop: headerPadding }]}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Discover</Text>
      </View>

      {/* Featured Carousel */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured</Text>
        <FlatList
          data={featured}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={FEATURED_CARD_WIDTH + spacing.md}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          keyExtractor={(item) => item.idDrink}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
              <Pressable
                onPress={() => router.push(`/cocktail/${item.idDrink}`)}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <View style={[styles.featuredCard, { width: FEATURED_CARD_WIDTH }]}>
                  <Image source={{ uri: item.strDrinkThumb }} style={styles.featuredImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.featuredGradient}
                  >
                    <Text style={styles.featuredCategory}>{item.strCategory}</Text>
                    <Text style={styles.featuredName}>{item.strDrink}</Text>
                    <View style={styles.featuredMeta}>
                      <Ionicons name="wine-outline" size={14} color="#F59E0B" />
                      <Text style={styles.featuredGlass}>{item.strGlass}</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          keyExtractor={(item) => item.strCategory}
          renderItem={({ item, index }) => (
            <CategoryPill
              name={item.strCategory}
              index={index}
              onPress={() =>
                router.push(`/category/${encodeURIComponent(item.strCategory)}`)
              }
            />
          )}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Mood-Based */}
      <View style={styles.section}>
        <MoodSelector />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Seasonal */}
      <View style={styles.section}>
        <SeasonalSection />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Popular Cocktails */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Cocktails</Text>
        <View style={styles.grid}>
          {popular.map((item, index) => (
            <CocktailCard
              key={item.idDrink}
              cocktail={{
                idDrink: item.idDrink,
                strDrink: item.strDrink,
                strDrinkThumb: item.strDrinkThumb,
              }}
              index={index}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pageTitle: {
    ...typography.hero,
  },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    ...typography.h3,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    opacity: 0.5,
  },
  featuredCard: {
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing['4xl'],
  },
  featuredCategory: {
    ...typography.small,
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredName: { ...typography.h2, color: '#FFFFFF', marginTop: spacing.xs },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  featuredGlass: { ...typography.caption, color: '#D1D5DB' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
