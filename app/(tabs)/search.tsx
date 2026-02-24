import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { cocktailService } from '../../src/services/cocktailService';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { CocktailListRowSkeleton } from '../../src/components/ui/Skeleton';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { Cocktail } from '../../src/types/cocktail';
import type { CocktailSummary } from '../../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type FilterType = 'all' | 'alcoholic' | 'non_alcoholic';
type ListMode = 'all' | 'favorites';

export default function CocktailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { favorites } = useFavoritesStore();

  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [listMode, setListMode] = useState<ListMode>('all');

  const fetchAll = useCallback(async () => {
    try {
      const batches: string[][] = [];
      for (let i = 0; i < ALPHABET.length; i += 6) {
        batches.push(ALPHABET.slice(i, i + 6));
      }
      let accumulated: Cocktail[] = [];
      for (const batch of batches) {
        const results = await Promise.all(
          batch.map((letter) => cocktailService.searchByFirstLetter(letter)),
        );
        const newItems = results.flat();
        accumulated = [...accumulated, ...newItems];
        setAllCocktails([...accumulated]);
        if (accumulated.length > 0) setLoading(false);
      }
    } catch (e) {
      console.error('Failed to load cocktails', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Pull-to-refresh is visual only to avoid API rate limit (429).
  // Full list is loaded once on mount; re-fetching would trigger too many requests.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const filteredData = useMemo(() => {
    let data = allCocktails;

    if (filter === 'alcoholic') {
      data = data.filter((c) => c.strAlcoholic === 'Alcoholic');
    } else if (filter === 'non_alcoholic') {
      data = data.filter((c) => c.strAlcoholic !== 'Alcoholic');
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (c) =>
          c.strDrink.toLowerCase().includes(q) ||
          c.strCategory.toLowerCase().includes(q),
      );
    }

    return data.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [allCocktails, query, filter]);

  const favoritesFiltered = useMemo(() => {
    if (!query.trim()) return [...favorites].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
    const q = query.toLowerCase();
    return favorites
      .filter((c) => c.strDrink.toLowerCase().includes(q))
      .sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [favorites, query]);

  const listData = listMode === 'favorites' ? favoritesFiltered : filteredData;
  const isFavoritesMode = listMode === 'favorites';

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'alcoholic', label: 'Alcoholic' },
    { key: 'non_alcoholic', label: 'Non-Alcoholic' },
  ];

  const renderCocktailItem = ({ item }: { item: Cocktail }) => (
    <Pressable
      onPress={() => router.push(`/cocktail/${item.idDrink}`)}
      style={({ pressed }) => [
        styles.listItem,
        { backgroundColor: pressed ? theme.surface : 'transparent' },
      ]}
    >
      <Image source={{ uri: item.strDrinkThumb }} style={styles.listImage} />
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: theme.text }]} numberOfLines={1}>
          {item.strDrink}
        </Text>
        <Text style={[styles.listCategory, { color: theme.textTertiary }]} numberOfLines={1}>
          {item.strCategory} · {item.strGlass}
        </Text>
      </View>
      <View
        style={[
          styles.alcBadge,
          {
            backgroundColor:
              item.strAlcoholic === 'Alcoholic' ? '#EF444412' : '#10B98112',
          },
        ]}
      >
        <Text
          style={[
            styles.alcBadgeText,
            {
              color:
                item.strAlcoholic === 'Alcoholic' ? '#EF4444' : '#10B981',
            },
          ]}
        >
          {item.strAlcoholic === 'Alcoholic' ? 'ALC' : 'N/A'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
    </Pressable>
  );

  const renderFavoriteItem = ({ item }: { item: CocktailSummary }) => (
    <Pressable
      onPress={() => router.push(`/cocktail/${item.idDrink}`)}
      style={({ pressed }) => [
        styles.listItem,
        { backgroundColor: pressed ? theme.surface : 'transparent' },
      ]}
    >
      <Image source={{ uri: item.strDrinkThumb }} style={styles.listImage} />
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: theme.text }]} numberOfLines={1}>
          {item.strDrink}
        </Text>
        <Text style={[styles.listCategory, { color: theme.textTertiary }]} numberOfLines={1}>
          Favorite
        </Text>
      </View>
      <Ionicons name="heart" size={18} color="#EF4444" />
      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
    </Pressable>
  );

  const renderItem = ({ item }: { item: Cocktail | CocktailSummary }) =>
    isFavoritesMode ? renderFavoriteItem({ item: item as CocktailSummary }) : renderCocktailItem({ item: item as Cocktail });

  const showSkeleton = loading && !isFavoritesMode && allCocktails.length === 0;
  const SKELETON_ROWS = 12;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Cocktails</Text>

        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search all cocktails..."
            placeholderTextColor={theme.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => router.push('/ingredient-search')}
          style={[styles.ingredientButton, { backgroundColor: theme.accent + '12' }]}
        >
          <Ionicons name="flask" size={18} color={theme.accent} />
          <Text style={[styles.ingredientButtonText, { color: theme.accent }]}>
            Search by ingredients
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.accent} />
        </Pressable>

        <View style={styles.listModeTabs}>
          <Pressable
            onPress={() => setListMode('all')}
            style={[
              styles.listModeTab,
              { backgroundColor: listMode === 'all' ? theme.accent : theme.surfaceSecondary },
            ]}
          >
            <Ionicons name="list" size={18} color={listMode === 'all' ? '#FFFFFF' : theme.textSecondary} />
            <Text style={[styles.listModeTabText, { color: listMode === 'all' ? '#FFFFFF' : theme.textSecondary }]}>
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setListMode('favorites')}
            style={[
              styles.listModeTab,
              { backgroundColor: listMode === 'favorites' ? theme.accent : theme.surfaceSecondary },
            ]}
          >
            <Ionicons name="heart" size={18} color={listMode === 'favorites' ? '#FFFFFF' : theme.textSecondary} />
            <Text style={[styles.listModeTabText, { color: listMode === 'favorites' ? '#FFFFFF' : theme.textSecondary }]}>
              Favorites ({favorites.length})
            </Text>
          </Pressable>
        </View>

        {listMode === 'all' && (
        <View style={styles.filters}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? theme.accent : theme.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        )}

        <Text style={[styles.countLabel, { color: theme.textTertiary }]}>
          {showSkeleton ? 'Loading...' : `${listData.length} cocktail${listData.length !== 1 ? 's' : ''}`}
        </Text>
      </Animated.View>

      {showSkeleton ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <View key={i}>
              <CocktailListRowSkeleton />
              {i < SKELETON_ROWS - 1 && (
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
              )}
            </View>
          ))}
        </View>
      ) : listData.length === 0 ? (
        <EmptyState
          icon={isFavoritesMode ? 'heart-outline' : 'wine-outline'}
          title={isFavoritesMode ? 'No favorites yet' : 'No cocktails found'}
          subtitle={isFavoritesMode ? 'Add cocktails to favorites from their detail screen' : 'Try a different search term or filter'}
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.idDrink}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.hero,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  ingredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ingredientButtonText: {
    ...typography.captionBold,
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterText: { ...typography.captionBold },
  listModeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  listModeTabText: { ...typography.captionBold },
  skeletonList: {
    paddingBottom: 120,
  },
  countLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: 120,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  listImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  listInfo: {
    flex: 1,
    gap: 2,
  },
  listName: {
    ...typography.bodyBold,
  },
  listCategory: {
    ...typography.small,
  },
  alcBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  alcBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  separator: {
    height: 0.5,
    marginLeft: spacing.lg + 50 + spacing.md,
  },
});
