import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { estimateABV, estimateCalories } from '../../utils/alcohol';
import { typography, spacing, borderRadius } from '../../theme';
import type { Ingredient } from '../../types/cocktail';

interface AlcoholInfoProps {
  ingredients: Ingredient[];
  isAlcoholic: boolean;
}

export function AlcoholInfo({ ingredients, isAlcoholic }: AlcoholInfoProps) {
  const { theme } = useThemeStore();
  const abv = estimateABV(ingredients);
  const calories = estimateCalories(ingredients);
  const strength = abv > 20 ? 'Strong' : abv > 10 ? 'Medium' : 'Light';
  const strengthColor = abv > 20 ? '#EF4444' : abv > 10 ? '#F59E0B' : '#10B981';

  if (!isAlcoholic) return null;

  const stats = [
    { icon: 'wine' as const, value: `${abv.toFixed(1)}%`, label: 'ABV', color: theme.accent },
    { icon: 'flame' as const, value: `${calories}`, label: 'kcal', color: '#EF4444' },
    { icon: 'speedometer' as const, value: strength, label: 'Strength', color: strengthColor },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <View style={styles.row}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconWrap, { backgroundColor: s.color + '15' }]}>
              <Ionicons name={s.icon} size={16} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: 3,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...typography.captionBold },
  statLabel: { ...typography.small },
});
