import { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { cocktailService } from '../src/services/cocktailService';
import { useCocktailPickerStore } from '../src/stores/useCocktailPickerStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../src/theme';
import type { Cocktail } from '../src/types/cocktail';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

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
    if (!query.trim()) return allCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
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
    setPendingSelection({ id: item.idDrink, name: item.strDrink });
    router.back();
  };

  const renderItem = ({ item }: { item: Cocktail }) => (
    <Pressable
      onPress={() => onSelect(item)}
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
              color: item.strAlcoholic === 'Alcoholic' ? '#EF4444' : '#10B981',
            },
          ]}
        >
          {item.strAlcoholic === 'Alcoholic' ? 'ALC' : 'N/A'}
        </Text>
      </View>
      <Ionicons name="checkmark-circle-outline" size={22} color={theme.accent} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Select cocktail</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search cocktails..."
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
      </View>

      {loading && allCocktails.length === 0 ? (
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon="wine-outline"
          title="No cocktails found"
          subtitle="Try a different search"
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.idDrink}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={() => Keyboard.dismiss()}
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
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  list: { paddingBottom: 120 },
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
  listName: { ...typography.bodyBold },
  listCategory: { ...typography.small },
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
  loader: { marginTop: 40 },
});
