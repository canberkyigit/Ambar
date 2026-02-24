import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { multiplyMeasure } from '../../utils/unitConverter';
import { typography, spacing, borderRadius } from '../../theme';
import type { Ingredient } from '../../types/cocktail';

interface PartyModeProps {
  ingredients: Ingredient[];
}

export function PartyMode({ ingredients }: PartyModeProps) {
  const { theme } = useThemeStore();
  const [people, setPeople] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);

  const handleChange = (delta: number) => {
    const next = Math.max(1, Math.min(20, people + delta));
    setPeople(next);
    scale.value = withSpring(1.1, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!expanded) {
    return (
      <Animated.View entering={FadeInDown.delay(550).springify()}>
        <Pressable
          onPress={() => setExpanded(true)}
          style={[styles.toggleBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="people" size={22} color={theme.accent} />
          <Text style={[styles.toggleText, { color: theme.text }]}>Party Mode</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Pressable onPress={() => setExpanded(false)} style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="people" size={22} color={theme.accent} />
            <Text style={[styles.title, { color: theme.text }]}>Party Mode</Text>
          </View>
          <Ionicons name="chevron-up" size={18} color={theme.textTertiary} />
        </Pressable>

        <View style={styles.stepper}>
          <Pressable
            onPress={() => handleChange(-1)}
            style={[styles.stepBtn, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Ionicons name="remove" size={20} color={theme.text} />
          </Pressable>
          <Animated.View style={animatedStyle}>
            <Text style={[styles.peopleCount, { color: theme.accent }]}>{people}</Text>
            <Text style={[styles.peopleLabel, { color: theme.textSecondary }]}>
              {people === 1 ? 'person' : 'people'}
            </Text>
          </Animated.View>
          <Pressable
            onPress={() => handleChange(1)}
            style={[styles.stepBtn, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Ionicons name="add" size={20} color={theme.text} />
          </Pressable>
        </View>

        {people > 1 && (
          <View style={styles.ingredientsList}>
            {ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingRow, i < ingredients.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                <Text style={[styles.ingName, { color: theme.text }]}>{ing.name}</Text>
                <Text style={[styles.ingMeasure, { color: theme.accent }]}>
                  {multiplyMeasure(ing.measure, people) || `${people}x`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    borderRadius: borderRadius.xl, gap: spacing.md, marginTop: spacing.lg,
  },
  toggleText: { ...typography.bodyBold, flex: 1 },
  container: { borderRadius: borderRadius.xl, padding: spacing.xl, marginTop: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.h3 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing['2xl'], marginTop: spacing.xl },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  peopleCount: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  peopleLabel: { ...typography.caption, textAlign: 'center' },
  ingredientsList: { marginTop: spacing.lg },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  ingName: { ...typography.body },
  ingMeasure: { ...typography.bodyBold },
});
