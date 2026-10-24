import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../src/stores/useThemeStore';
import { convert, ALL_UNITS, UNIT_LABELS, Unit } from '../src/utils/unitConverter';
import { Chip, IconButton, NavHeader } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';

const QUICK_REFS = [
  { label: '1 oz', value: '29.57 ml' },
  { label: '1 jigger', value: '44.36 ml' },
  { label: '1 dash', value: '0.9 ml' },
  { label: '1 tbsp', value: '14.79 ml' },
  { label: '1 cup', value: '236.59 ml' },
];

export default function UnitConverterScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [input, setInput] = useState('1');
  const [fromUnit, setFromUnit] = useState<Unit>('oz');
  const [toUnit, setToUnit] = useState<Unit>('ml');

  const numericValue = parseFloat(input) || 0;
  const result = convert(numericValue, fromUnit, toUnit);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const renderUnitPicker = (selected: Unit, onSelect: (u: Unit) => void, label: string) => (
    <View style={styles.pickerSection}>
      <Text style={[typography.overline, styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.unitScroll}
        contentContainerStyle={styles.unitRow}
        keyboardShouldPersistTaps="handled"
      >
        {ALL_UNITS.map((u) => (
          <Chip key={u} label={u} selected={selected === u} onPress={() => onSelect(u)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Unit converter" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Converter card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.side}>
            <Text style={[typography.overline, { color: theme.textSecondary }]}>{UNIT_LABELS[fromUnit]}</Text>
            <TextInput
              style={[styles.value, { color: theme.text }]}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
              selectTextOnFocus
              accessibilityLabel={`Value in ${UNIT_LABELS[fromUnit]}`}
            />
          </View>

          <View style={styles.divider}>
            <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
            <IconButton icon="swap-vertical" variant="tinted" size={40} onPress={swapUnits} accessibilityLabel="Swap units" />
            <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
          </View>

          <View style={styles.side}>
            <Text style={[typography.overline, { color: theme.textSecondary }]}>{UNIT_LABELS[toUnit]}</Text>
            <Text style={[styles.value, { color: theme.accent }]} numberOfLines={1} adjustsFontSizeToFit selectable>
              {result}
            </Text>
          </View>
        </View>

        {renderUnitPicker(fromUnit, setFromUnit, 'From')}
        {renderUnitPicker(toUnit, setToUnit, 'To')}

        <Text style={[typography.h2, styles.sectionTitle, { color: theme.text }]}>Quick reference</Text>
        <View style={[styles.refTable, { backgroundColor: theme.surface }]}>
          {QUICK_REFS.map((ref, i) => (
            <View
              key={ref.label}
              style={[
                styles.refRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
              ]}
            >
              <Text style={[typography.body, { color: theme.text }]}>{ref.label}</Text>
              <Text style={[styles.refValue, { color: theme.textSecondary }]}>{ref.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm },
  card: { borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  side: { paddingVertical: spacing.sm, gap: spacing.xs },
  value: { ...typography.hero, fontVariant: ['tabular-nums'], padding: 0 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hairline: { flex: 1, height: StyleSheet.hairlineWidth },
  pickerSection: { marginTop: spacing.xl },
  label: { marginBottom: spacing.sm },
  unitScroll: { marginHorizontal: -GUTTER },
  unitRow: { paddingHorizontal: GUTTER, gap: spacing.sm },
  sectionTitle: { marginTop: spacing['3xl'], marginBottom: spacing.md },
  refTable: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  refValue: { ...typography.bodyBold, fontVariant: ['tabular-nums'] },
});
