import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useUserProfileStore } from '../../stores/useUserProfileStore';
import { CircularProgress } from '../shared/CircularProgress';
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

  const saveSettings = () => {
    const w = parseFloat(tempWeight);
    if (w > 0) setProfile({ weight: w });
    setShowSettings(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(400).springify()}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: level.color + '15' }]}>
            <Ionicons name="analytics" size={16} color={level.color} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>BAC Estimate</Text>
          <Pressable onPress={() => setShowSettings(true)} hitSlop={8}>
            <Ionicons name="settings-outline" size={18} color={theme.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <CircularProgress
            size={120}
            strokeWidth={8}
            progress={progress}
            color={level.color}
            bgColor={theme.border}
          >
            <Text style={[styles.promilValue, { color: level.color }]}>{promil.toFixed(1)}</Text>
            <Text style={[styles.promilUnit, { color: theme.textTertiary }]}>promil</Text>
          </CircularProgress>

          <View style={styles.infoCol}>
            <View style={[styles.levelBadge, { backgroundColor: level.color + '15' }]}>
              <View style={[styles.levelDot, { backgroundColor: level.color }]} />
              <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
            </View>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{level.description}</Text>

            <View style={styles.countRow}>
              <Pressable
                onPress={() => setDrinkCount(Math.max(1, drinkCount - 1))}
                style={[styles.countBtn, { backgroundColor: theme.surfaceSecondary }]}
              >
                <Ionicons name="remove" size={16} color={theme.text} />
              </Pressable>
              <Text style={[styles.countText, { color: theme.text }]}>
                {drinkCount} drink{drinkCount > 1 ? 's' : ''}
              </Text>
              <Pressable
                onPress={() => setDrinkCount(drinkCount + 1)}
                style={[styles.countBtn, { backgroundColor: theme.surfaceSecondary }]}
              >
                <Ionicons name="add" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
          Based on {profile.weight}kg, {profile.gender}. Tap gear to adjust.
        </Text>
      </View>

      <Modal visible={showSettings} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowSettings(false)}>
          <Pressable style={[styles.modal, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <View style={styles.modalHandle}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Your Profile</Text>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>WEIGHT (KG)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
                value={tempWeight}
                onChangeText={setTempWeight}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>GENDER</Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as const).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setProfile({ gender: g })}
                    style={[
                      styles.genderBtn,
                      { backgroundColor: profile.gender === g ? theme.accent : theme.surfaceSecondary },
                    ]}
                  >
                    <Ionicons
                      name={g === 'male' ? 'male' : 'female'}
                      size={16}
                      color={profile.gender === g ? '#FFF' : theme.textSecondary}
                    />
                    <Text style={{ color: profile.gender === g ? '#FFF' : theme.textSecondary, ...typography.captionBold }}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              onPress={saveSettings}
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: borderRadius.xl, padding: spacing.lg, marginTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  headerIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.bodyBold, flex: 1 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  promilValue: { fontSize: 28, fontWeight: '800' },
  promilUnit: { ...typography.small, marginTop: 1 },
  infoCol: { flex: 1, gap: spacing.sm },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, gap: spacing.xs,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelText: { ...typography.captionBold },
  description: { ...typography.small, lineHeight: 15 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  countBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countText: { ...typography.captionBold, minWidth: 56, textAlign: 'center' },
  disclaimer: { ...typography.small, marginTop: spacing.md, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modal: { width: '100%', borderRadius: borderRadius.xl, padding: spacing.xl },
  modalHandle: { alignItems: 'center', marginBottom: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2 },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg },
  modalField: { marginBottom: spacing.lg },
  modalLabel: { ...typography.small, letterSpacing: 1, marginBottom: spacing.sm },
  modalInput: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg, ...typography.body },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.xs,
  },
  saveBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveBtnText: { ...typography.button, color: '#FFF' },
});
