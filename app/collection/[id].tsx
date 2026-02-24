import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useCollectionsStore } from '../../src/stores/useCollectionsStore';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { CocktailSummary } from '../../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - COLUMN_GAP) / 2;

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
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Not Found</Text>
          <View style={{ width: 28 }} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Collection not found"
          subtitle="This collection may have been removed"
        />
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: CocktailSummary; index: number }) => (
    <View style={{ width: CARD_WIDTH }}>
      <CocktailCard cocktail={item} index={index} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {collection.emoji} {collection.name}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {collection.description ? (
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {collection.description}
          </Text>
        </Animated.View>
      ) : null}

      {collection.cocktails.length === 0 ? (
        <EmptyState
          icon="wine-outline"
          title="No cocktails yet"
          subtitle="Add cocktails from their detail page"
        />
      ) : (
        <FlatList
          data={collection.cocktails}
          keyExtractor={(item) => item.idDrink}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  description: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  row: {
    gap: COLUMN_GAP,
  },
});
