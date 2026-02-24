import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { cocktailService } from '../src/services/cocktailService';
import { CocktailCard } from '../src/components/cocktail/CocktailCard';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../src/theme';
import type { CocktailSummary } from '../src/types/cocktail';

export default function IngredientSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [results, setResults] = useState<CocktailSummary[]>([]);
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
      const data = await cocktailService.getByIngredient(selectedIngredients[0]);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          Search by Ingredients
        </Text>
        <View style={{ width: 28 }} />
      </Animated.View>

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedIngredients}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => toggleIngredient(item)}
                style={[styles.selectedChip, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.selectedChipText}>{item}</Text>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
          />
          <Pressable
            onPress={searchByIngredients}
            style={[styles.searchButton, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
      )}

      {/* Ingredient Filter */}
      <View style={[styles.filterBar, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.filterInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="flask-outline" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.filterTextInput, { color: theme.text }]}
            placeholder="Filter ingredients..."
            placeholderTextColor={theme.textTertiary}
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>
      </View>

      {/* Results or Ingredient List */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>
                {results.length} cocktail{results.length !== 1 ? 's' : ''} found
              </Text>
              <Pressable onPress={() => setResults([])}>
                <Text style={[styles.clearText, { color: theme.accent }]}>Clear</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }) => (
            <CocktailCard cocktail={item} index={index} />
          )}
        />
      ) : loadingIngredients ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => toggleIngredient(item)}
              style={[styles.ingredientItem, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.ingredientName, { color: theme.text }]}>{item}</Text>
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
            </Pressable>
          )}
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
  },
  selectedContainer: {
    paddingVertical: spacing.md,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  selectedChipText: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  filterBar: {
    paddingVertical: spacing.sm,
  },
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  filterTextInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ingredientName: {
    ...typography.body,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.bodyBold,
  },
  clearText: {
    ...typography.bodyBold,
  },
});
