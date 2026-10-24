import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { getSubstitutions, hasSubstitution } from '../../utils/substitutions';
import { typography, spacing, borderRadius } from '../../theme';
import { Sheet } from '../ui/Sheet';

interface SubstitutionTipProps {
  ingredientName: string;
}

export function SubstitutionTip({ ingredientName }: SubstitutionTipProps) {
  const { theme } = useThemeStore();
  const [visible, setVisible] = useState(false);
  const subs = getSubstitutions(ingredientName);

  if (!hasSubstitution(ingredientName)) return null;

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={10}
        style={[styles.pill, { backgroundColor: theme.accentLight }]}
        accessibilityRole="button"
        accessibilityLabel={`Substitutes for ${ingredientName}`}
      >
        <Ionicons name="swap-horizontal" size={12} color={theme.accent} />
        <Text style={[styles.pillText, { color: theme.accent }]}>Swap</Text>
      </Pressable>

      <Sheet visible={visible} onClose={() => setVisible(false)} title={`Instead of ${ingredientName}`}>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.lg }]}>
          These work as substitutes:
        </Text>
        <View style={[styles.list, { backgroundColor: theme.surface }]}>
          {subs.map((sub, i) => (
            <View
              key={sub}
              style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator }]}
            >
              <Text style={[typography.body, { color: theme.text }]}>{sub}</Text>
            </View>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  pillText: { ...typography.small, fontWeight: '700' },
  list: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  item: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg },
});
