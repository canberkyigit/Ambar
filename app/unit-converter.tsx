import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { convert, ALL_UNITS, UNIT_LABELS, Unit } from '../src/utils/unitConverter';
import { typography, spacing, borderRadius } from '../src/theme';

const QUICK_REFS = [
  { label: '1 oz', value: '29.57 ml' },
  { label: '1 jigger', value: '44.36 ml' },
  { label: '1 dash', value: '0.9 ml' },
  { label: '1 tbsp', value: '14.79 ml' },
  { label: '1 cup', value: '236.59 ml' },
];

export default function UnitConverterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [input, setInput] = useState('1');
  const [fromUnit, setFromUnit] = useState<Unit>('oz');
  const [toUnit, setToUnit] = useState<Unit>('ml');

  const resultScale = useSharedValue(1);

  const numericValue = parseFloat(input) || 0;
  const result = convert(numericValue, fromUnit, toUnit);

  useEffect(() => {
    resultScale.value = 0.85;
    resultScale.value = withSpring(1, { damping: 12, stiffness: 150 });
  }, [input, fromUnit, toUnit]);

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const renderUnitPicker = (selected: Unit, onSelect: (u: Unit) => void, label: string) => (
    <View style={styles.pickerSection}>
      <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
        {ALL_UNITS.map((u) => {
          const active = selected === u;
          return (
            <Pressable
              key={u}
              onPress={() => onSelect(u)}
              style={[
                styles.unitChip,
                { backgroundColor: active ? theme.accent : theme.surface },
              ]}
            >
              <Text style={[styles.unitChipText, { color: active ? '#FFF' : theme.text }]}>{u}</Text>
              <Text style={[styles.unitChipLabel, { color: active ? 'rgba(255,255,255,0.7)' : theme.textTertiary }]}>
                {UNIT_LABELS[u]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Converter</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.inputLabel, { color: theme.textTertiary }]}>VALUE</Text>
            <TextInput
              style={[styles.valueInput, { color: theme.text }]}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              selectTextOnFocus
            />
          </View>
        </Animated.View>

        {renderUnitPicker(fromUnit, setFromUnit, 'FROM')}

        <Pressable onPress={swapUnits} style={[styles.swapBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name="swap-vertical" size={20} color={theme.accent} />
        </Pressable>

        {renderUnitPicker(toUnit, setToUnit, 'TO')}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.resultCard, { backgroundColor: theme.accent + '10' }]}>
            <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>RESULT</Text>
            <Animated.View style={resultAnimatedStyle}>
              <Text style={[styles.resultValue, { color: theme.accent }]}>{result}</Text>
              <Text style={[styles.resultUnit, { color: theme.textSecondary }]}>{UNIT_LABELS[toUnit]}</Text>
            </Animated.View>
            <Text style={[styles.resultFormula, { color: theme.textTertiary }]}>
              {numericValue} {UNIT_LABELS[fromUnit]} = {result} {UNIT_LABELS[toUnit]}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Reference</Text>
          <View style={[styles.refTable, { backgroundColor: theme.surface }]}>
            {QUICK_REFS.map((ref, i) => (
              <View
                key={ref.label}
                style={[
                  styles.refRow,
                  i < QUICK_REFS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.refLabel, { color: theme.text }]}>{ref.label}</Text>
                <Text style={[styles.refValue, { color: theme.accent }]}>{ref.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  inputCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inputLabel: { ...typography.small, letterSpacing: 1, marginBottom: spacing.sm },
  valueInput: { ...typography.hero, textAlign: 'center', minWidth: 120, padding: 0 },
  pickerSection: { marginBottom: spacing.sm },
  pickerLabel: { ...typography.small, letterSpacing: 1, marginBottom: spacing.sm },
  unitRow: { gap: spacing.sm },
  unitChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 70,
  },
  unitChipText: { ...typography.bodyBold },
  unitChipLabel: { ...typography.small, marginTop: 1 },
  swapBtn: {
    alignSelf: 'center',
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  resultCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  resultLabel: { ...typography.small, letterSpacing: 1, marginBottom: spacing.sm },
  resultValue: { ...typography.hero, textAlign: 'center' },
  resultUnit: { ...typography.body, textAlign: 'center', marginTop: 2 },
  resultFormula: { ...typography.caption, marginTop: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  refTable: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  refLabel: { ...typography.body },
  refValue: { ...typography.bodyBold },
});
