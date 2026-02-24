import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { cocktailService } from '../../src/services/cocktailService';
import { CocktailCard } from '../../src/components/cocktail/CocktailCard';
import { typography, spacing } from '../../src/theme';
import type { CocktailSummary } from '../../src/types/cocktail';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [cocktails, setCocktails] = useState<CocktailSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedName = decodeURIComponent(name || '');

  useEffect(() => {
    if (decodedName) {
      cocktailService
        .getByCategory(decodedName)
        .then(setCocktails)
        .finally(() => setLoading(false));
    }
  }, [decodedName]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {decodedName}
        </Text>
        <View style={{ width: 28 }} />
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cocktails}
          numColumns={2}
          keyExtractor={(item) => item.idDrink}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CocktailCard cocktail={item} index={index} />
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
    marginHorizontal: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
});
