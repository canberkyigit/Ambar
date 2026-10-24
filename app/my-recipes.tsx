import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCustomRecipeStore } from '../src/stores/useCustomRecipeStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { Button, IconButton, NavHeader } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { CustomRecipe } from '../src/types/cocktail';

function RecipeCard({ recipe }: { recipe: CustomRecipe }) {
  const { theme } = useThemeStore();
  const { removeRecipe } = useCustomRecipeStore();

  const handleDelete = () => {
    Alert.alert('Delete recipe', `Are you sure you want to delete "${recipe.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeRecipe(recipe.id),
      },
    ]);
  };

  const count = recipe.ingredients.length;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      {recipe.image ? (
        <Image cachePolicy="memory-disk" transition={120} source={{ uri: recipe.image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons name="wine-outline" size={26} color={theme.textTertiary} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {recipe.category} · {count} {count === 1 ? 'ingredient' : 'ingredients'}
        </Text>
        <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>
          {recipe.alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
        </Text>
      </View>
      <IconButton
        icon="trash-outline"
        variant="plain"
        color={theme.textSecondary}
        onPress={handleDelete}
        accessibilityLabel={`Delete ${recipe.name}`}
      />
    </View>
  );
}

export default function MyRecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { recipes } = useCustomRecipeStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="My recipes"
        right={
          recipes.length > 0 ? (
            <IconButton
              icon="add"
              variant="tinted"
              size={38}
              onPress={() => router.push('/create-recipe')}
              accessibilityLabel="New recipe"
            />
          ) : null
        }
      />

      {recipes.length === 0 ? (
        <>
          <EmptyState
            icon="book-outline"
            title="No recipes yet"
            subtitle="Write down your own creations and keep them alongside the classics."
          />
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Button title="Create a recipe" icon="add" size="lg" fullWidth onPress={() => router.push('/create-recipe')} />
          </View>
        </>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  thumb: { width: 64, height: 64, borderRadius: borderRadius.md },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: 2 },
  meta: { ...typography.caption },
  bottomBar: { paddingHorizontal: GUTTER, paddingTop: spacing.md },
});
