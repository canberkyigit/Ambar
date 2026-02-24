import { View, Text, FlatList, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCustomRecipeStore } from '../src/stores/useCustomRecipeStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../src/theme';
import type { CustomRecipe } from '../src/types/cocktail';

function RecipeCard({ recipe, index }: { recipe: CustomRecipe; index: number }) {
  const { theme } = useThemeStore();
  const { removeRecipe } = useCustomRecipeStore();

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeRecipe(recipe.id),
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
            <Ionicons name="wine" size={32} color={theme.textTertiary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, { color: theme.text }]}>{recipe.name}</Text>
          <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
            {recipe.category} · {recipe.ingredients.length} ingredients
          </Text>
          <View style={styles.cardBadges}>
            <View style={[styles.cardBadge, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.cardBadgeText, { color: theme.accent }]}>
                {recipe.alcoholic ? 'Alcoholic' : 'Non-Alcoholic'}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={12}>
          <Ionicons name="trash-outline" size={20} color={theme.error} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function MyRecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { recipes } = useCustomRecipeStore();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>My Recipes</Text>
        <Pressable onPress={() => router.push('/create-recipe')} hitSlop={12}>
          <Ionicons name="add" size={28} color={theme.accent} />
        </Pressable>
      </View>

      {recipes.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No recipes yet"
          subtitle="Create your first custom cocktail recipe"
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <RecipeCard recipe={item} index={index} />
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
  },
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: 90,
    height: 90,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  cardName: {
    ...typography.bodyBold,
  },
  cardMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cardBadgeText: {
    ...typography.small,
  },
  deleteBtn: {
    padding: spacing.md,
    justifyContent: 'center',
  },
});
