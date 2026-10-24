import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, GUTTER } from '../../theme';
import { CocktailCardSkeleton } from '../ui/Skeleton';
import { getSeasonalConfig } from '../../utils/seasonalData';
import { cocktailService } from '../../services/cocktailService';
import { CocktailCard } from '../cocktail/CocktailCard';
import type { CocktailSummary } from '../../types/cocktail';

export function SeasonalSection() {
  const { theme } = useThemeStore();
  const [cocktails, setCocktails] = useState<CocktailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const config = getSeasonalConfig();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          config.cocktailNames.map((name) => cocktailService.searchByName(name)),
        );
        if (cancelled) return;

        const found: CocktailSummary[] = results
          .map((r) => r[0])
          .filter(Boolean)
          .map((c) => ({
            idDrink: c.idDrink,
            strDrink: c.strDrink,
            strDrinkThumb: c.strDrinkThumb,
          }));
        setCocktails(found);
      } catch {
        // network errors are non-critical here
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.cocktailNames]);

  return (
    <View>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: config.color + '22' }]}>
          <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h2, { color: theme.text }]}>{config.label}</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Picked for the season</Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.listContent, styles.skeletonRow]}>
          <CocktailCardSkeleton />
          <CocktailCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={cocktails}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CocktailCard cocktail={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { paddingHorizontal: GUTTER },
  skeletonRow: { flexDirection: 'row', gap: spacing.md },
  cardWrapper: { marginRight: spacing.md },
});
