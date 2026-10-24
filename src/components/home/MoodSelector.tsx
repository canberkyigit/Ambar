import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { spacing, GUTTER } from '../../theme';
import { Chip, SectionHeader } from '../ui';
import { CocktailCardSkeleton } from '../ui/Skeleton';
import { MOOD_MAP, ALL_MOODS } from '../../utils/moodMap';
import type { MoodType , CocktailSummary } from '../../types/cocktail';
import { cocktailService } from '../../services/cocktailService';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { CocktailCard } from '../cocktail/CocktailCard';

export function MoodSelector() {
  const markUnique = useAchievementStore((s) => s.markUnique);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [cocktails, setCocktails] = useState<CocktailSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMoodPress = useCallback(
    async (mood: MoodType) => {
      if (selectedMood === mood) {
        setSelectedMood(null);
        setCocktails([]);
        return;
      }

      setSelectedMood(mood);
      markUnique('taste_explorer', mood);
      setLoading(true);
      try {
        const config = MOOD_MAP[mood];
        const results = await Promise.all(
          config.cocktailNames.map((name) => cocktailService.searchByName(name)),
        );
        const found: CocktailSummary[] = results
          .map((r) => r[0])
          .filter(Boolean)
          .map((c) => ({
            idDrink: c.idDrink,
            strDrink: c.strDrink,
            strDrinkThumb: c.strDrinkThumb,
          }));
        setCocktails(found);
      } catch {
        setCocktails([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedMood, markUnique],
  );

  return (
    <View>
      <SectionHeader
        title="For your mood"
        actionLabel={selectedMood ? 'Clear' : undefined}
        onAction={() => {
          setSelectedMood(null);
          setCocktails([]);
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {ALL_MOODS.map((mood) => {
          const config = MOOD_MAP[mood];
          return (
            <Chip
              key={mood}
              label={config.label}
              icon={config.icon as keyof typeof Ionicons.glyphMap}
              iconColor={config.color}
              selected={selectedMood === mood}
              onPress={() => handleMoodPress(mood)}
            />
          );
        })}
      </ScrollView>

      {loading && (
        <View style={styles.listContent}>
          <View style={styles.skeletonRow}>
            <CocktailCardSkeleton />
            <CocktailCardSkeleton />
          </View>
        </View>
      )}

      {!loading && cocktails.length > 0 && (
        <Animated.View entering={FadeIn.duration(250)}>
          <FlatList
            data={cocktails}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.idDrink}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <CocktailCard cocktail={item} />
              </View>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    paddingHorizontal: GUTTER,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.lg,
  },
  skeletonRow: { flexDirection: 'row', gap: spacing.md },
  cardWrapper: {
    marginRight: spacing.md,
  },
});
