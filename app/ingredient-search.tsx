import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { cocktailService, type IngredientMatch } from '../src/services/cocktailService';
import { CocktailCard } from '../src/components/cocktail/CocktailCard';
import { Button, Chip, NavHeader, SearchField } from '../src/components/ui';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, GUTTER } from '../src/theme';

export default function IngredientSearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [results, setResults] = useState<IngredientMatch[]>([]);
  const [searchedCount, setSearchedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    cocktailService
      .getIngredientList()
      .then((data) => setAllIngredients(data.map((i) => i.strIngredient1)))
      .finally(() => setLoadingIngredients(false));
  }, []);

  const filteredIngredients = useMemo(
    () =>
      allIngredients.filter(
        (i) =>
          i.toLowerCase().includes(filterText.toLowerCase()) &&
          !selectedIngredients.includes(i)
      ),
    [allIngredients, filterText, selectedIngredients]
  );

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const searchByIngredients = async () => {
    if (selectedIngredients.length === 0) return;
    setLoading(true);
    Keyboard.dismiss();
    try {
      const data = await cocktailService.getByIngredients(selectedIngredients);
      setResults(data);
      setSearchedCount(selectedIngredients.length);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const showResults = results.length > 0;
  const showSearchBar = selectedIngredients.length > 0;
  const bottomPadding = insets.bottom + spacing['2xl'] + (showSearchBar ? 54 + spacing.md : 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Search by ingredient" />

      <SearchField
        value={filterText}
        onChangeText={setFilterText}
        placeholder="Filter ingredients"
        style={styles.searchField}
      />

      {/* Selected ingredients */}
      {selectedIngredients.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedRow}
          style={styles.selectedScroll}
        >
          {selectedIngredients.map((item) => (
            <Chip
              key={item}
              label={item}
              icon="close"
              selected
              onPress={() => toggleIngredient(item)}
            />
          ))}
        </ScrollView>
      )}

      {/* Results or ingredient list */}
      {showResults ? (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPadding }]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={[typography.overline, { color: theme.textSecondary }]}>
                {searchedCount > 1
                  ? `${results.filter((r) => r.matched === searchedCount).length} use all · ${results.length} total`
                  : `${results.length} cocktail${results.length !== 1 ? 's' : ''} found`}
              </Text>
              <Pressable onPress={() => setResults([])} hitSlop={10} accessibilityRole="button">
                <Text style={[typography.captionBold, { color: theme.accent }]}>Clear</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <CocktailCard
              cocktail={item}
              subtitle={
                searchedCount > 1
                  ? item.matched === searchedCount
                    ? `Uses all ${searchedCount}`
                    : `Uses ${item.matched} of ${searchedCount}`
                  : undefined
              }
            />
          )}
        />
      ) : loadingIngredients || loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => {
                haptics.selection();
                toggleIngredient(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item}`}
              style={({ pressed }) => [styles.ingredientItem, pressed && { backgroundColor: theme.surfaceSecondary }]}
            >
              <View
                style={[
                  styles.ingredientInner,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                ]}
              >
                <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{item}</Text>
                <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              </View>
            </Pressable>
          )}
        />
      )}

      {showSearchBar && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              backgroundColor: theme.background,
              borderTopColor: theme.separator,
            },
          ]}
        >
          <Button
            title="Find cocktails"
            icon="search"
            size="lg"
            fullWidth
            loading={loading}
            onPress={searchByIngredients}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchField: { marginHorizontal: GUTTER, marginBottom: spacing.md },
  selectedScroll: { flexGrow: 0, marginBottom: spacing.md },
  selectedRow: { paddingHorizontal: GUTTER, gap: spacing.sm },
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
  grid: { paddingHorizontal: GUTTER },
  gridRow: { gap: spacing.md },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
