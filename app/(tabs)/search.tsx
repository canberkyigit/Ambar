import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Keyboard,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useSearchHistoryStore } from '../../src/stores/useSearchHistoryStore';
import { cocktailService, prefetchCocktail } from '../../src/services/cocktailService';
import { getCocktailAttributes } from '../../src/utils/cocktailAttributes';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { CocktailListRowSkeleton } from '../../src/components/ui/Skeleton';
import { ScreenHeader, SearchField, IconButton, Chip, Sheet, Button, PressableScale } from '../../src/components/ui';
import { typography, spacing, borderRadius, GUTTER, TAB_BAR_CLEARANCE } from '../../src/theme';
import type { Cocktail, CocktailSummary } from '../../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const THUMB_SIZE = 56;

type FilterType = 'all' | 'alcoholic' | 'non_alcoholic' | 'favorites';

const DEFAULT_ATTR_FILTER = {
  alcoholMin: 0,
  sweetnessMin: 0,
  sournessMin: 0,
  bitternessMin: 0,
  caloriesMax: 500,
};
type AttrFilter = typeof DEFAULT_ATTR_FILTER;

function activeAttrFilterCount(f: AttrFilter) {
  return (Object.keys(DEFAULT_ATTR_FILTER) as (keyof AttrFilter)[]).filter(
    (k) => f[k] !== DEFAULT_ATTR_FILTER[k],
  ).length;
}

const SLIDERS: {
  key: keyof AttrFilter;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  { key: 'alcoholMin', label: 'Minimum strength', min: 0, max: 100, step: 5, format: (v) => (v === 0 ? 'Any' : `${v}%`) },
  { key: 'sweetnessMin', label: 'Minimum sweetness', min: 0, max: 100, step: 5, format: (v) => (v === 0 ? 'Any' : `${v}`) },
  { key: 'sournessMin', label: 'Minimum sourness', min: 0, max: 100, step: 5, format: (v) => (v === 0 ? 'Any' : `${v}`) },
  { key: 'bitternessMin', label: 'Minimum bitterness', min: 0, max: 100, step: 5, format: (v) => (v === 0 ? 'Any' : `${v}`) },
  { key: 'caloriesMax', label: 'Maximum calories', min: 50, max: 500, step: 10, format: (v) => (v === 500 ? 'Any' : `${v} kcal`) },
];

/** One list row. Memoized so scrolling and favoriting don't re-render the whole list. */
const CocktailRow = memo(function CocktailRow({
  item,
  favorite,
  onPress,
}: {
  item: Cocktail | CocktailSummary;
  favorite: boolean;
  onPress: (id: string) => void;
}) {
  const { theme } = useThemeStore();
  const full = 'strCategory' in item ? (item as Cocktail) : null;
  const alcoholFree = full ? full.strAlcoholic !== 'Alcoholic' : false;
  return (
    <Pressable
      onPressIn={() => prefetchCocktail(item.idDrink, item.strDrinkThumb)}
      onPress={() => onPress(item.idDrink)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surface }]}
      accessibilityRole="button"
      accessibilityLabel={item.strDrink}
    >
      <Image
        cachePolicy="memory-disk"
        transition={120}
        recyclingKey={item.idDrink}
        source={{ uri: `${item.strDrinkThumb}/preview` }}
        style={[styles.thumb, { backgroundColor: theme.surfaceSecondary }]}
      />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>
          {item.strDrink}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.textSecondary }]} numberOfLines={1}>
          {full ? `${full.strCategory} · ${full.strGlass}` : 'Saved to favorites'}
        </Text>
      </View>
      {alcoholFree && (
        <View style={[styles.tag, { backgroundColor: theme.success + '1F' }]}>
          <Text style={[styles.tagText, { color: theme.success }]}>0%</Text>
        </View>
      )}
      {favorite && <Ionicons name="heart" size={16} color={theme.heart} />}
    </Pressable>
  );
});

export default function CocktailsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const favorites = useFavoritesStore((s) => s.favorites);
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistoryStore();

  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [attrFilter, setAttrFilter] = useState(DEFAULT_ATTR_FILTER);

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

  const applyAttrFilter = useCallback(
    (data: Cocktail[], f: AttrFilter) => {
      if (activeAttrFilterCount(f) === 0) return data;
      return data.filter((c) => {
        const attrs = attributesMap.get(c.idDrink);
        if (!attrs) return true;
        return (
          attrs.alcoholLevel >= f.alcoholMin &&
          attrs.sweetness >= f.sweetnessMin &&
          attrs.sourness >= f.sournessMin &&
          attrs.bitterness >= f.bitternessMin &&
          attrs.calories <= f.caloriesMax
        );
      });
    },
    [attributesMap],
  );

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

    return [...applyAttrFilter(data, attrFilter)].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [allCocktails, query, filter, attrFilter, applyAttrFilter]);

  const favoritesFiltered = useMemo(() => {
    if (!query.trim()) return [...favorites].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
    const q = query.toLowerCase();
    return favorites
      .filter((c) => c.strDrink.toLowerCase().includes(q))
      .sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [favorites, query]);

  const isFavoritesMode = filter === 'favorites';
  const listData: (Cocktail | CocktailSummary)[] = isFavoritesMode ? favoritesFiltered : filteredData;
  const attrCount = activeAttrFilterCount(attrFilter);
  const showSkeleton = loading && !isFavoritesMode && allCocktails.length === 0;
  const showHistory = !query.trim() && !isFavoritesMode && history.length > 0 && !showSkeleton;

  const filters: { key: FilterType; label: string; icon?: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All' },
    { key: 'alcoholic', label: 'Alcoholic' },
    { key: 'non_alcoholic', label: 'Alcohol-free', icon: 'leaf-outline' },
    { key: 'favorites', label: favorites.length ? `Favorites · ${favorites.length}` : 'Favorites', icon: 'heart-outline' },
  ];

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.idDrink)), [favorites]);
  const openCocktail = useCallback((id: string) => router.push(`/cocktail/${id}`), [router]);
  const renderItem = useCallback(
    ({ item }: { item: Cocktail | CocktailSummary }) => (
      <CocktailRow item={item} favorite={favoriteIds.has(item.idDrink)} onPress={openCocktail} />
    ),
    [favoriteIds, openCocktail],
  );

  const header = (
    <View>
      <ScreenHeader
        title="Cocktails"
        subtitle={showSkeleton ? 'Loading recipes…' : `${listData.length} ${listData.length === 1 ? 'recipe' : 'recipes'}`}
      />

      <View style={styles.searchWrap}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or category"
          onSubmitEditing={() => {
            if (query.trim()) addSearch(query.trim());
          }}
          accessory={
            <View>
              <IconButton
                icon="options-outline"
                variant={attrCount ? 'tinted' : 'surface'}
                size={42}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowFilterSheet(true);
                }}
                accessibilityLabel="Filters"
                badge={attrCount}
              />
            </View>
          }
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
      >
        {filters.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            icon={f.icon}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {!isFavoritesMode && (
        <PressableScale
          onPress={() => router.push('/ingredient-search')}
          style={[styles.ingredientCard, { backgroundColor: theme.accentLight }]}
          accessibilityRole="button"
        >
          <View style={[styles.ingredientIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="flask" size={18} color={theme.onAccent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyBold, { color: theme.text }]}>What can I make?</Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>Find recipes from what&apos;s in your bar</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={theme.accent} />
        </PressableScale>
      )}

      {showHistory && (
        <View style={styles.history}>
          <View style={styles.historyHeader}>
            <Text style={[typography.overline, { color: theme.textSecondary }]}>Recent</Text>
            <Pressable onPress={clearHistory} hitSlop={10}>
              <Text style={[typography.captionBold, { color: theme.accent }]}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
            {history.map((term) => (
              <Chip
                key={term}
                label={term}
                icon="time-outline"
                onPress={() => {
                  setQuery(term);
                  addSearch(term);
                }}
                onLongPress={() => removeSearch(term)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.listTop, { borderBottomColor: theme.separator }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={showSkeleton ? [] : listData}
        keyExtractor={(item) => item.idDrink}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        )}
        ListEmptyComponent={
          showSkeleton ? (
            <View>
              {Array.from({ length: 10 }).map((_, i) => (
                <CocktailListRowSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <EmptyState
                icon={isFavoritesMode ? 'heart-outline' : 'wine-outline'}
                title={isFavoritesMode ? 'No favorites yet' : 'No cocktails found'}
                subtitle={
                  isFavoritesMode
                    ? 'Tap the heart on any cocktail to keep it here.'
                    : attrCount
                      ? 'Try loosening your filters.'
                      : 'Try a different name or category.'
                }
              />
              {!isFavoritesMode && attrCount > 0 && (
                <Button title="Reset filters" variant="tinted" size="sm" onPress={() => setAttrFilter(DEFAULT_ATTR_FILTER)} />
              )}
            </View>
          )
        }
        renderItem={renderItem}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
        removeClippedSubviews
      />

      <Sheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filters"
        headerRight={
          attrCount > 0 ? (
            <Pressable onPress={() => setAttrFilter(DEFAULT_ATTR_FILTER)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: theme.accent }]}>Reset</Text>
            </Pressable>
          ) : null
        }
      >
        {SLIDERS.map((s) => (
          <View key={s.key} style={styles.sliderBlock}>
            <View style={styles.sliderHeader}>
              <Text style={[typography.body, { color: theme.text }]}>{s.label}</Text>
              <Text style={[typography.captionBold, { color: attrFilter[s.key] === DEFAULT_ATTR_FILTER[s.key] ? theme.textTertiary : theme.accent }]}>
                {s.format(Math.round(attrFilter[s.key]))}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={s.min}
              maximumValue={s.max}
              step={s.step}
              value={attrFilter[s.key]}
              onValueChange={(v) => setAttrFilter((f) => ({ ...f, [s.key]: v }))}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.surfaceSecondary}
            />
          </View>
        ))}
        <Button
          title={`Show ${filteredData.length} ${filteredData.length === 1 ? 'result' : 'results'}`}
          size="lg"
          fullWidth
          onPress={() => {
            if (isFavoritesMode) setFilter('all');
            setShowFilterSheet(false);
          }}
          style={{ marginTop: spacing.sm }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: GUTTER, marginBottom: spacing.md },
  chips: { paddingHorizontal: GUTTER, gap: spacing.sm },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: GUTTER,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ingredientIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  history: { paddingTop: spacing.xl, paddingHorizontal: GUTTER },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyList: { gap: spacing.sm },
  listTop: { height: spacing.md, borderBottomWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: spacing.sm,
    gap: spacing.md + 2,
  },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: borderRadius.md },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { ...typography.bodyBold },
  rowMeta: { ...typography.caption },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: GUTTER + THUMB_SIZE + spacing.md + 2 },
  empty: { flex: 1, alignItems: 'center', paddingTop: spacing['4xl'] },
  sliderBlock: { marginBottom: spacing.md },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slider: { height: 36, marginHorizontal: -4 },
});
