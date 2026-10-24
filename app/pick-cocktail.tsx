import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../src/stores/useThemeStore';
import { cocktailService } from '../src/services/cocktailService';
import { useCocktailPickerStore } from '../src/stores/useCocktailPickerStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { CocktailListRowSkeleton } from '../src/components/ui/Skeleton';
import { NavHeader, SearchField } from '../src/components/ui';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { Cocktail } from '../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const THUMB_SIZE = 56;

export default function PickCocktailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setPendingSelection } = useCocktailPickerStore();

  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const batches: string[][] = [];
        for (let i = 0; i < ALPHABET.length; i += 6) {
          batches.push(ALPHABET.slice(i, i + 6));
        }

        let accumulated: Cocktail[] = [];
        for (const batch of batches) {
          if (cancelled) return;
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
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const filteredData = useMemo(() => {
    if (!query.trim()) return [...allCocktails].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
    const q = query.toLowerCase();
    return allCocktails
      .filter(
        (c) =>
          c.strDrink.toLowerCase().includes(q) ||
          c.strCategory?.toLowerCase().includes(q),
      )
      .sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }, [allCocktails, query]);

  const onSelect = (item: Cocktail) => {
    haptics.selection();
    setPendingSelection({ id: item.idDrink, name: item.strDrink });
    router.back();
  };

  const renderItem = ({ item }: { item: Cocktail }) => (
    <Pressable
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.strDrink}`}
    >
      <Image cachePolicy="memory-disk" transition={120}
        source={{ uri: `${item.strDrinkThumb}/preview` }}
        style={[styles.thumb, { backgroundColor: theme.surfaceSecondary }]}
      />
      <View style={styles.rowInfo}>
        <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
          {item.strDrink}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.strCategory} · {item.strGlass}
        </Text>
      </View>
      {item.strAlcoholic !== 'Alcoholic' && (
        <View style={[styles.tag, { backgroundColor: theme.success + '1F' }]}>
          <Text style={[styles.tagText, { color: theme.success }]}>0%</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Select cocktail" modal />
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Search cocktails"
        style={styles.searchField}
      />

      {loading && allCocktails.length === 0 ? (
        <View>
          {Array.from({ length: 10 }).map((_, i) => (
            <CocktailListRowSkeleton key={i} />
          ))}
        </View>
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon="wine-outline"
          title="No cocktails found"
          subtitle="Try a different name or category."
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.idDrink}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.separator }]} />
          )}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchField: { marginHorizontal: GUTTER, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: spacing.sm,
    gap: spacing.md + 2,
  },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: borderRadius.md },
  rowInfo: { flex: 1, gap: 2 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: GUTTER + THUMB_SIZE + spacing.md + 2 },
});
