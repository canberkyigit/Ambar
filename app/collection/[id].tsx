import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useCollectionsStore } from '../../src/stores/useCollectionsStore';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { Button, NavHeader } from '../../src/components/ui';
import { typography, spacing, GUTTER } from '../../src/theme';
import type { CocktailSummary } from '../../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - COLUMN_GAP) / 2;

export default function CollectionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useThemeStore();
  const { collections } = useCollectionsStore();

  const collection = useMemo(
    () => collections.find((c) => c.id === id),
    [collections, id],
  );

  if (!collection) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <NavHeader />
        <EmptyState
          icon="albums-outline"
          title="Collection not found"
          subtitle="It may have been deleted. Head back to see your other collections."
        />
      </View>
    );
  }

  const count = collection.cocktails.length;

  const renderItem = ({ item }: { item: CocktailSummary }) => (
    <View style={{ width: CARD_WIDTH }}>
      <CocktailCard cocktail={item} />
    </View>
  );

  const intro = (
    <View style={styles.intro}>
      <Text style={styles.emoji}>{collection.emoji}</Text>
      <Text style={[typography.h1, { color: theme.text }]}>{collection.name}</Text>
      {collection.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{collection.description}</Text>
      ) : null}
      <Text style={[typography.overline, styles.count, { color: theme.textTertiary }]}>
        {count} {count === 1 ? 'cocktail' : 'cocktails'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader />

      {count === 0 ? (
        <>
          <View style={styles.introPad}>{intro}</View>
          <EmptyState
            icon="wine-outline"
            title="No cocktails yet"
            subtitle="Open any cocktail and save it to this collection."
          />
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Button title="Browse cocktails" icon="search" size="lg" fullWidth onPress={() => router.push('/(tabs)/search')} />
          </View>
        </>
      ) : (
        <FlatList
          data={collection.cocktails}
          keyExtractor={(item) => item.idDrink}
          renderItem={renderItem}
          numColumns={2}
          ListHeaderComponent={intro}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  introPad: { paddingHorizontal: GUTTER },
  intro: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  emoji: { fontSize: 36, marginBottom: spacing.sm },
  description: { ...typography.body, marginTop: spacing.xs },
  count: { marginTop: spacing.md },
  listContent: { paddingHorizontal: GUTTER },
  row: { gap: COLUMN_GAP },
  bottomBar: { paddingHorizontal: GUTTER, paddingTop: spacing.md },
});
