import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useUserProfileStore } from '../../stores/useUserProfileStore';
import { CircularProgress } from '../shared/CircularProgress';
import { Button, Chip, IconButton, Sheet } from '../ui';
import { haptics } from '../../utils/haptics';
import {
  estimateTotalAlcoholGrams,
  calculateBAC,
  getBACLevel,
  promilFromBAC,
} from '../../utils/alcohol';
import { typography, spacing, borderRadius } from '../../theme';
import type { Ingredient } from '../../types/cocktail';

interface BACEstimatorProps {
  ingredients: Ingredient[];
}

const FALLBACK_PROFILE = { weight: 70, gender: 'male' as const };

export function BACEstimator({ ingredients }: BACEstimatorProps) {
  const { theme } = useThemeStore();
  const { profile: storedProfile, setProfile } = useUserProfileStore();
  const profile = storedProfile ?? FALLBACK_PROFILE;
  const [drinkCount, setDrinkCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [tempWeight, setTempWeight] = useState(profile.weight.toString());

  const alcoholGrams = estimateTotalAlcoholGrams(ingredients);
  const bac = calculateBAC(alcoholGrams, profile.weight, profile.gender, drinkCount);
  const promil = promilFromBAC(bac);
  const level = getBACLevel(bac);
  const progress = Math.min(bac / 0.2, 1);

  const openSettings = () => {
    setTempWeight(profile.weight.toString());
    setShowSettings(true);
  };

  const saveSettings = () => {
    const w = parseFloat(tempWeight);
    if (w > 0) setProfile({ weight: w });
    setShowSettings(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h2, { color: theme.text }]}>Blood alcohol</Text>
        <IconButton icon="options-outline" size={36} onPress={openSettings} accessibilityLabel="Edit your profile" />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <CircularProgress size={112} strokeWidth={8} progress={progress} color={level.color} bgColor={theme.surfaceSecondary}>
          <Text style={[styles.promilValue, { color: theme.text }]}>{promil.toFixed(1)}</Text>
          <Text style={[typography.small, { color: theme.textSecondary }]}>‰ BAC</Text>
        </CircularProgress>

        <View style={styles.infoCol}>
          <View style={styles.levelRow}>
            <View style={[styles.levelDot, { backgroundColor: level.color }]} />
            <Text style={[typography.bodyBold, { color: theme.text }]}>{level.label}</Text>
          </View>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{level.description}</Text>

          <View style={[styles.stepper, { backgroundColor: theme.surfaceSecondary }]}>
            <Pressable
              onPress={() => {
                haptics.selection();
                setDrinkCount(Math.max(1, drinkCount - 1));
              }}
              disabled={drinkCount === 1}
              hitSlop={6}
              style={styles.stepperBtn}
              accessibilityLabel="Fewer drinks"
            >
              <Ionicons name="remove" size={18} color={drinkCount === 1 ? theme.textTertiary : theme.text} />
            </Pressable>
            <Text style={[styles.stepperText, { color: theme.text }]}>
              {drinkCount} drink{drinkCount > 1 ? 's' : ''}
            </Text>
            <Pressable
              onPress={() => {
                haptics.selection();
                setDrinkCount(drinkCount + 1);
              }}
              hitSlop={6}
              style={styles.stepperBtn}
              accessibilityLabel="More drinks"
            >
              <Ionicons name="add" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={[typography.caption, styles.disclaimer, { color: theme.textTertiary }]}>
        Rough estimate for {profile.weight} kg, {profile.gender}. Never use it to decide whether you can drive.
      </Text>

      <Sheet visible={showSettings} onClose={() => setShowSettings(false)} title="Your profile">
        <View>
          <Text style={[typography.overline, styles.fieldLabel, { color: theme.textSecondary }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
            value={tempWeight}
            onChangeText={setTempWeight}
            keyboardType="numeric"
            selectionColor={theme.accent}
            placeholder="70"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Weight in kilograms"
          />

          <Text style={[typography.overline, styles.fieldLabel, { color: theme.textSecondary }]}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female'] as const).map((g) => (
              <Chip
                key={g}
                label={g === 'male' ? 'Male' : 'Female'}
                icon={g === 'male' ? 'male' : 'female'}
                selected={profile.gender === g}
                onPress={() => setProfile({ gender: g })}
              />
            ))}
          </View>

          <Button title="Save" size="lg" fullWidth onPress={saveSettings} style={styles.saveBtn} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing['3xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  promilValue: { ...typography.h1, fontVariant: ['tabular-nums'] },
  infoCol: { flex: 1, gap: spacing.xs },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: 4,
    height: 34,
    marginTop: spacing.sm,
  },
  stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperText: { ...typography.captionBold, minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  disclaimer: { marginTop: spacing.sm, marginHorizontal: spacing.xs },
  fieldLabel: { marginBottom: spacing.sm },
  input: {
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    ...typography.body,
  },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: { marginTop: spacing['2xl'] },
});
