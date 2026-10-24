import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useMyBarStore } from '../src/stores/useMyBarStore';
import { useAchievementStore } from '../src/stores/useAchievementStore';
import { cocktailService, type IngredientMatch } from '../src/services/cocktailService';
import { CocktailCard } from '../src/components/cocktail/CocktailCard';
import { EmptyState } from '../src/components/shared/EmptyState';
import { NavHeader, SearchField } from '../src/components/ui';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { IngredientItem } from '../src/types/cocktail';

type Tab = 'ingredients' | 'cocktails';

export default function MyBarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { ingredients: myIngredients, toggleIngredient, hasIngredient } = useMyBarStore();
  const { increment } = useAchievementStore();

  const [activeTab, setActiveTab] = useState<Tab>('ingredients');
  const [search, setSearch] = useState('');
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [cocktails, setCocktails] = useState<IngredientMatch[]>([]);
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
    cocktailService.getByIngredients(myIngredients).then((data) => {
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
        <Pressable
          onPress={() => {
            haptics.selection();
            handleToggle(name);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          style={({ pressed }) => [styles.ingredientItem, pressed && { backgroundColor: theme.surfaceSecondary }]}
        >
          <View
            style={[
              styles.ingredientInner,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
            ]}
          >
            <Text style={[typography.body, styles.ingredientName, { color: theme.text }]}>{name}</Text>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selected ? theme.accent : theme.textTertiary}
            />
          </View>
        </Pressable>
      );
    },
    [theme, hasIngredient, handleToggle],
  );

  const renderCocktailItem = useCallback(
    ({ item }: { item: IngredientMatch }) => (
      <CocktailCard
        cocktail={item}
        size="large"
        subtitle={item.missing === 0 ? 'You have everything' : `Missing ${item.missing} ${item.missing === 1 ? 'ingredient' : 'ingredients'}`}
      />
    ),
    [],
  );

  const listPadding = { paddingBottom: insets.bottom + spacing['2xl'] };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="My bar"
        right={
          <View style={[styles.countBadge, { backgroundColor: theme.accentLight }]}>
            <Text
              style={[typography.captionBold, { color: theme.accent }]}
              accessibilityLabel={`${myIngredients.length} ingredients in your bar`}
            >
              {myIngredients.length}
            </Text>
          </View>
        }
      />

      {/* Segmented control */}
      <View style={[styles.segmentedControl, { backgroundColor: theme.surfaceSecondary }]}>
        {(['ingredients', 'cocktails'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => {
                if (!active) haptics.selection();
                setActiveTab(tab);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && { backgroundColor: theme.surface }]}
            >
              <Text style={[typography.captionBold, { color: active ? theme.text : theme.textSecondary }]}>
                {tab === 'ingredients' ? 'Ingredients' : 'Recipes'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'ingredients' ? (
        <>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search ingredients"
            style={styles.searchField}
          />

          {loadingIngredients ? (
            <ActivityIndicator color={theme.accent} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredIngredients}
              keyExtractor={(item) => item.strIngredient1}
              renderItem={renderIngredientItem}
              contentContainerStyle={listPadding}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="search-outline"
                  title="No matching ingredients"
                  subtitle="Check the spelling or try a shorter search."
                />
              }
            />
          )}
        </>
      ) : loadingCocktails ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : myIngredients.length === 0 ? (
        <EmptyState
          icon="wine-outline"
          title="No ingredients yet"
          subtitle="Switch to Ingredients and tick what you have to see what you can make."
        />
      ) : cocktails.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No cocktails found"
          subtitle="Try adding more common ingredients, like vodka, gin or lime."
        />
      ) : (
        <FlatList
          data={cocktails}
          keyExtractor={(item) => item.idDrink}
          renderItem={renderCocktailItem}
          contentContainerStyle={[styles.cocktailList, listPadding]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  countBadge: {
    minWidth: 32,
    height: 28,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    marginBottom: spacing.md,
    padding: 3,
    borderRadius: borderRadius.md,
  },
  segment: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm + 1,
  },
  searchField: { marginHorizontal: GUTTER, marginBottom: spacing.sm },
  loader: { marginTop: spacing['4xl'] },
  ingredientItem: { paddingLeft: GUTTER },
  ingredientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingRight: GUTTER,
  },
  ingredientName: { flex: 1 },
  cocktailList: { paddingHorizontal: GUTTER, paddingTop: spacing.xs },
});
