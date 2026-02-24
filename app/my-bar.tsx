import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useMyBarStore } from '../src/stores/useMyBarStore';
import { useAchievementStore } from '../src/stores/useAchievementStore';
import { cocktailService } from '../src/services/cocktailService';
import { CocktailCard } from '../src/components/cocktail/CocktailCard';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../src/theme';
import type { CocktailSummary, IngredientItem } from '../src/types/cocktail';

type Tab = 'ingredients' | 'cocktails';

export default function MyBarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { ingredients: myIngredients, toggleIngredient, hasIngredient } = useMyBarStore();
  const { increment } = useAchievementStore();

  const [activeTab, setActiveTab] = useState<Tab>('ingredients');
  const [search, setSearch] = useState('');
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [cocktails, setCocktails] = useState<CocktailSummary[]>([]);
  const [loadingCocktails, setLoadingCocktails] = useState(false);

  useEffect(() => {
    cocktailService.getIngredientList().then((data) => {
      setAllIngredients(data);
      setLoadingIngredients(false);
    }).catch(() => setLoadingIngredients(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'cocktails' || myIngredients.length === 0) {
      setCocktails([]);
      return;
    }
    setLoadingCocktails(true);
    cocktailService.getByIngredient(myIngredients[0]).then((data) => {
      setCocktails(data);
      setLoadingCocktails(false);
    }).catch(() => {
      setCocktails([]);
      setLoadingCocktails(false);
    });
  }, [activeTab, myIngredients]);

  const handleToggle = useCallback((name: string) => {
    const wasIn = hasIngredient(name);
    toggleIngredient(name);
    if (!wasIn) increment('bar_master');
  }, [toggleIngredient, hasIngredient, increment]);

  const filteredIngredients = useMemo(() => {
    if (!search.trim()) return allIngredients;
    const q = search.toLowerCase();
    return allIngredients.filter((i) => i.strIngredient1.toLowerCase().includes(q));
  }, [allIngredients, search]);

  const renderIngredientItem = useCallback(
    ({ item, index }: { item: IngredientItem; index: number }) => {
      const name = item.strIngredient1;
      const selected = hasIngredient(name);

      return (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 20, 400)).springify()}>
          <Pressable
            onPress={() => handleToggle(name)}
            style={({ pressed }) => [
              styles.ingredientItem,
              {
                backgroundColor: selected ? theme.accent + '12' : theme.surface,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={[
              styles.checkCircle,
              { backgroundColor: selected ? theme.accent : theme.surfaceSecondary },
            ]}>
              {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.ingredientName, { color: selected ? theme.text : theme.textSecondary }]}>
              {name}
            </Text>
          </Pressable>
        </Animated.View>
      );
    },
    [theme, hasIngredient, handleToggle],
  );

  const renderCocktailItem = useCallback(
    ({ item, index }: { item: CocktailSummary; index: number }) => (
      <View style={styles.cocktailCardWrapper}>
        <CocktailCard cocktail={item} index={index} size="large" />
      </View>
    ),
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>My Bar</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.accent + '18' }]}>
          <Text style={[styles.countText, { color: theme.accent }]}>{myIngredients.length}</Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentedControl, { backgroundColor: theme.surface }]}>
        {(['ingredients', 'cocktails'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.segment,
                active && { backgroundColor: theme.accent },
              ]}
            >
              <Ionicons
                name={tab === 'ingredients' ? 'list' : 'wine'}
                size={16}
                color={active ? '#FFF' : theme.textSecondary}
              />
              <Text style={[styles.segmentText, { color: active ? '#FFF' : theme.textSecondary }]}>
                {tab === 'ingredients' ? 'Ingredients' : 'Recipes'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'ingredients' ? (
        <>
          <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
            <Ionicons name="search" size={18} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search ingredients..."
              placeholderTextColor={theme.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
              </Pressable>
            )}
          </View>

          {loadingIngredients ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredIngredients}
              keyExtractor={(item) => item.strIngredient1}
              renderItem={renderIngredientItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <>
          {loadingCocktails ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : myIngredients.length === 0 ? (
            <EmptyState
              icon="wine-outline"
              title="No ingredients yet"
              subtitle="Add ingredients to see what you can make"
            />
          ) : cocktails.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No cocktails found"
              subtitle="Try adding more common ingredients"
            />
          ) : (
            <FlatList
              data={cocktails}
              keyExtractor={(item) => item.idDrink}
              renderItem={renderCocktailItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2 },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countText: { ...typography.captionBold },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  segmentText: { ...typography.captionBold },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, padding: 0 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs + 2,
    gap: spacing.md,
  },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ingredientName: { ...typography.body, flex: 1 },
  cocktailCardWrapper: { marginBottom: spacing.xs },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
