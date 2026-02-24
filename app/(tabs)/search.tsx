import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { cocktailService } from '../../src/services/cocktailService';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { Cocktail } from '../../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type FilterType = 'all' | 'alcoholic' | 'non_alcoholic';

export default function CocktailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

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

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'alcoholic', label: 'Alcoholic' },
    { key: 'non_alcoholic', label: 'Non-Alcoholic' },
  ];

  const renderItem = ({ item }: { item: Cocktail }) => (
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

        <Text style={[styles.countLabel, { color: theme.textTertiary }]}>
          {loading ? 'Loading...' : `${filteredData.length} cocktails`}
        </Text>
      </Animated.View>

      {loading && allCocktails.length === 0 ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon="wine-outline"
          title="No cocktails found"
          subtitle="Try a different search term or filter"
        />
      ) : (
        <FlatList
          data={filteredData}
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
