import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { cocktailService } from '../../src/services/cocktailService';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { CocktailCardSkeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { NavHeader } from '../../src/components/ui';
import { spacing, GUTTER } from '../../src/theme';
import type { CocktailSummary } from '../../src/types/cocktail';

const CELL_WIDTH = (Dimensions.get('window').width - GUTTER * 2 - spacing.md) / 2;

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [cocktails, setCocktails] = useState<CocktailSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedName = decodeURIComponent(name || '');
  const markUnique = useAchievementStore((s) => s.markUnique);

  useEffect(() => {
    if (decodedName) markUnique('explorer', decodedName);
  }, [decodedName, markUnique]);

  useEffect(() => {
    if (decodedName) {
      cocktailService
        .getByCategory(decodedName)
        .then(setCocktails)
        .finally(() => setLoading(false));
    }
  }, [decodedName]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title={decodedName} />

      {loading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCell}>
              <CocktailCardSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={cocktails}
          numColumns={2}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CocktailCard cocktail={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="wine-outline"
              title="No cocktails here"
              subtitle="Check your connection, or browse another category from Explore."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, flexGrow: 1 },
  row: { gap: spacing.md },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    paddingHorizontal: GUTTER,
    paddingTop: spacing.sm,
  },
  skeletonCell: { width: CELL_WIDTH },
});
