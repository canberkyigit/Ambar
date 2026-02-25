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
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useSearchHistoryStore } from '../../src/stores/useSearchHistoryStore';
import { cocktailService } from '../../src/services/cocktailService';
import { getCocktailAttributes } from '../../src/utils/cocktailAttributes';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { CocktailListRowSkeleton } from '../../src/components/ui/Skeleton';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { Cocktail } from '../../src/types/cocktail';
import type { CocktailSummary } from '../../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type FilterType = 'all' | 'alcoholic' | 'non_alcoholic';
type ListMode = 'all' | 'favorites';

const DEFAULT_ATTR_FILTER = {
  alcoholMin: 0,
  sweetnessMin: 0,
  sournessMin: 0,
  bitternessMin: 0,
  caloriesMax: 500,
};

function isDefaultAttrFilter(f: typeof DEFAULT_ATTR_FILTER) {
  return (
    f.alcoholMin === DEFAULT_ATTR_FILTER.alcoholMin &&
    f.sweetnessMin === DEFAULT_ATTR_FILTER.sweetnessMin &&
    f.sournessMin === DEFAULT_ATTR_FILTER.sournessMin &&
    f.bitternessMin === DEFAULT_ATTR_FILTER.bitternessMin &&
    f.caloriesMax === DEFAULT_ATTR_FILTER.caloriesMax
  );
}

export default function CocktailsScreen() {
  const router = useRouter();
  const { paddingTop: headerPadding } = useHeaderPadding();
  const { theme } = useThemeStore();
  const { favorites } = useFavoritesStore();
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistoryStore();

  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [listMode, setListMode] = useState<ListMode>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [attrFilter, setAttrFilter] = useState(DEFAULT_ATTR_FILTER);
  const filterExpand = useSharedValue(0);

  const toggleFilterPanel = useCallback(() => {
    const next = showFilterModal ? 0 : 1;
    filterExpand.value = withSpring(next, { damping: 20, stiffness: 200 });
    setShowFilterModal(!showFilterModal);
  }, [showFilterModal, filterExpand]);

  const filterPanelAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: filterExpand.value * 520,
    opacity: filterExpand.value,
    overflow: 'hidden' as const,
  }));

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

  const attributesMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getCocktailAttributes>>();
    allCocktails.forEach((c) => map.set(c.idDrink, getCocktailAttributes(c)));
    return map;
  }, [allCocktails]);

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

    if (!isDefaultAttrFilter(attrFilter)) {
      data = data.filter((c) => {
        const attrs = attributesMap.get(c.idDrink);
        if (!attrs) return true;
        return (
          attrs.alcoholLevel >= attrFilter.alcoholMin &&
          attrs.sweetness >= attrFilter.sweetnessMin &&
          attrs.sourness >= attrFilter.sournessMin &&
          attrs.bitterness >= attrFilter.bitternessMin &&
          attrs.calories <= attrFilter.caloriesMax
        );
      });
    }

    return data.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [allCocktails, query, filter, attrFilter, attributesMap]);

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
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: headerPadding }]}>
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
            onSubmitEditing={() => { if (query.trim()) addSearch(query.trim()); }}
            returnKeyType="search"
            autoCorrect={false}
          />
          <Pressable
            onPress={toggleFilterPanel}
            hitSlop={8}
            style={[
              styles.filterBarBtn,
              { backgroundColor: showFilterModal || !isDefaultAttrFilter(attrFilter) ? theme.accent + '25' : theme.surfaceSecondary, borderColor: theme.border },
            ]}
          >
            <Ionicons name="filter" size={20} color={showFilterModal || !isDefaultAttrFilter(attrFilter) ? theme.accent : theme.text} />
          </Pressable>
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>

        <Animated.View style={[styles.filterPanelWrap, filterPanelAnimatedStyle]}>
          <View style={[styles.filterPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.filterPanelHeader}>
              <Text style={[styles.filterPanelTitle, { color: theme.text }]}>Filters</Text>
              <Pressable onPress={() => setAttrFilter(DEFAULT_ATTR_FILTER)} hitSlop={8}>
                <Text style={[styles.filterPanelReset, { color: theme.accent }]}>Reset</Text>
              </Pressable>
            </View>
            <View style={styles.filterPanelSliders}>
              <View style={styles.sliderBlock}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Min. alcohol level</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={attrFilter.alcoholMin}
                    onValueChange={(v) => setAttrFilter((f) => ({ ...f, alcoholMin: v }))}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                  <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{Math.round(attrFilter.alcoholMin)}%</Text>
                </View>
              </View>
              <View style={styles.sliderBlock}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Min. sweetness</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={attrFilter.sweetnessMin}
                    onValueChange={(v) => setAttrFilter((f) => ({ ...f, sweetnessMin: v }))}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                  <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{Math.round(attrFilter.sweetnessMin)}</Text>
                </View>
              </View>
              <View style={styles.sliderBlock}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Min. sourness</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={attrFilter.sournessMin}
                    onValueChange={(v) => setAttrFilter((f) => ({ ...f, sournessMin: v }))}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                  <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{Math.round(attrFilter.sournessMin)}</Text>
                </View>
              </View>
              <View style={styles.sliderBlock}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Min. bitterness</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={attrFilter.bitternessMin}
                    onValueChange={(v) => setAttrFilter((f) => ({ ...f, bitternessMin: v }))}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                  <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{Math.round(attrFilter.bitternessMin)}</Text>
                </View>
              </View>
              <View style={styles.sliderBlock}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Max. calories</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={50}
                    maximumValue={500}
                    step={10}
                    value={attrFilter.caloriesMax}
                    onValueChange={(v) => setAttrFilter((f) => ({ ...f, caloriesMax: v }))}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                  <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{Math.round(attrFilter.caloriesMax)} kcal</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={toggleFilterPanel}
              style={[styles.filterPanelDone, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.filterPanelDoneText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>

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

      {!query.trim() && !isFavoritesMode && history.length > 0 && !showSkeleton && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.textSecondary }]}>Son aramalar</Text>
            <Pressable onPress={clearHistory} hitSlop={8}>
              <Text style={[styles.historyClear, { color: theme.accent }]}>Temizle</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
            {history.map((term) => (
              <Pressable
                key={term}
                onPress={() => { setQuery(term); addSearch(term); }}
                onLongPress={() => removeSearch(term)}
                style={[styles.historyChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              >
                <Ionicons name="time-outline" size={14} color={theme.textTertiary} />
                <Text style={[styles.historyChipText, { color: theme.text }]} numberOfLines={1}>{term}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

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
  filterBarBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  filterPanelWrap: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  filterPanel: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  filterPanelTitle: { ...typography.h3 },
  filterPanelReset: { ...typography.bodyBold },
  filterPanelSliders: {},
  filterPanelDone: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  filterPanelDoneText: { ...typography.button, color: '#FFF' },
  sliderBlock: { marginBottom: spacing.lg },
  sliderLabel: { ...typography.bodyBold, marginBottom: spacing.xs },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  slider: { flex: 1, height: 32 },
  sliderValue: { ...typography.captionBold, minWidth: 56, textAlign: 'right' },
  historySection: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyTitle: { ...typography.captionBold },
  historyClear: { ...typography.caption },
  historyList: {
    gap: spacing.sm,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  historyChipText: { ...typography.caption, maxWidth: 120 },
});
