import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';
import { getSeasonalConfig } from '../../utils/seasonalData';
import { cocktailService } from '../../services/cocktailService';
import { CocktailCard } from '../cocktail/CocktailCard';
import type { CocktailSummary } from '../../types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.container}>
      <View style={[styles.banner, { backgroundColor: config.color + '15' }]}>
        <View style={[styles.bannerIcon, { backgroundColor: config.color + '25' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.title, { color: theme.text }]}>{config.label}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Seasonal picks just for you
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={cocktails}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <CocktailCard cocktail={item} index={index} />
            </View>
          )}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  bannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerText: { flex: 1 },
  title: { ...typography.bodyBold },
  subtitle: { ...typography.small, marginTop: 1 },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginRight: spacing.md,
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
  },
});
