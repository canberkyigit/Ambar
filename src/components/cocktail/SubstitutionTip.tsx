import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { getSubstitutions, hasSubstitution } from '../../utils/substitutions';
import { typography, spacing, borderRadius } from '../../theme';

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
      <Pressable onPress={() => setVisible(true)} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="swap-horizontal" size={16} color={theme.accent} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={[styles.title, { color: theme.text }]}>
              Substitutes for {ingredientName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Don't have this ingredient? Try these alternatives:
            </Text>
            {subs.map((sub, i) => (
              <Animated.View key={sub} entering={FadeIn.delay(i * 80)}>
                <View style={[styles.subItem, { backgroundColor: theme.surfaceSecondary }]}>
                  <Ionicons name="arrow-forward" size={16} color={theme.accent} />
                  <Text style={[styles.subText, { color: theme.text }]}>{sub}</Text>
                </View>
              </Animated.View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: { padding: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['5xl'],
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#999',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: { ...typography.h3, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  subItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
  },
  subText: { ...typography.body },
});
