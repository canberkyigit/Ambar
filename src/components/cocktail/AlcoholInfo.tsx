import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { estimateABV, estimateCalories } from '../../utils/alcohol';
import { typography, spacing, borderRadius } from '../../theme';
import type { Ingredient } from '../../types/cocktail';

interface AlcoholInfoProps {
  ingredients: Ingredient[];
  isAlcoholic: boolean;
}

/** Compact stat strip: ABV · calories · strength. */
export function AlcoholInfo({ ingredients, isAlcoholic }: AlcoholInfoProps) {
  const { theme } = useThemeStore();
  const abv = isAlcoholic ? estimateABV(ingredients) : 0;
  const calories = estimateCalories(ingredients);
  const strength = !isAlcoholic ? 'None' : abv > 20 ? 'Strong' : abv > 10 ? 'Medium' : 'Light';

  const stats = [
    { value: isAlcoholic ? `${abv.toFixed(0)}%` : '0%', label: 'ABV (est.)' },
    { value: `${calories}`, label: 'Calories' },
    { value: strength, label: 'Strength' },
  ];

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.separator }]}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[styles.stat, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.border }]}
        >
          <Text style={[styles.value, { color: theme.text }]}>{s.value}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.xl,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  value: { ...typography.h3, fontVariant: ['tabular-nums'] },
  label: { ...typography.small },
});
