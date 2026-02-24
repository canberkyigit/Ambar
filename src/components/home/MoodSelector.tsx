import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';
import { MOOD_MAP, ALL_MOODS } from '../../utils/moodMap';
import type { MoodType } from '../../types/cocktail';
import type { CocktailSummary } from '../../types/cocktail';
import { cocktailService } from '../../services/cocktailService';
import { CocktailCard } from '../cocktail/CocktailCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MoodSelector() {
  const { theme } = useThemeStore();
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
    [selectedMood],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>How are you feeling?</Text>
        {selectedMood && (
          <Pressable onPress={() => { setSelectedMood(null); setCocktails([]); }}>
            <Text style={[styles.clearBtn, { color: theme.accent }]}>Clear</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {ALL_MOODS.map((mood, index) => {
          const config = MOOD_MAP[mood];
          const isSelected = selectedMood === mood;

          return (
            <Animated.View key={mood} entering={FadeInRight.delay(index * 50).springify()}>
              <Pressable
                onPress={() => handleMoodPress(mood)}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: isSelected ? config.color : theme.surface,
                    borderColor: isSelected ? config.color : theme.border,
                    transform: [{ scale: pressed ? 0.93 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={config.icon as any}
                  size={18}
                  color={isSelected ? '#FFF' : config.color}
                />
                <Text
                  style={[
                    styles.pillLabel,
                    { color: isSelected ? '#FFF' : theme.text },
                  ]}
                >
                  {config.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {loading && (
        <ActivityIndicator size="small" color={theme.accent} style={styles.loader} />
      )}

      {!loading && cocktails.length > 0 && (
        <Animated.View entering={FadeIn.duration(400)}>
          <FlatList
            data={cocktails}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.idDrink}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrapper}>
                <CocktailCard cocktail={item} index={index} />
              </View>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  clearBtn: {
    ...typography.captionBold,
  },
  pillRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs + 2,
  },
  pillLabel: {
    ...typography.captionBold,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  cardWrapper: {
    marginRight: spacing.md,
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
  },
});
