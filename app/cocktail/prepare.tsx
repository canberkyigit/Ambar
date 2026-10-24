import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { useChallengeStore } from '../../src/stores/useChallengeStore';
import { useToastStore } from '../../src/stores/useToastStore';
import { formatMeasure } from '../../src/utils/formatMeasure';
import { haptics } from '../../src/utils/haptics';
import { Button, IconButton, NavHeader } from '../../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../../src/theme';

export default function PrepareScreen() {
  const { steps: stepsParam, name, ingredients: ingredientsParam } = useLocalSearchParams<{
    steps: string;
    name: string;
    ingredients: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { increment } = useAchievementStore();

  const steps: string[] = stepsParam ? JSON.parse(stepsParam) : [];
  const ingredientsList: { name: string; measure: string }[] = ingredientsParam
    ? JSON.parse(ingredientsParam)
    : [];
  const [currentStep, setCurrentStep] = useState(-1);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const totalSteps = steps.length;
  const isIngredientStep = currentStep === -1;
  const [gathered, setGathered] = useState<Set<number>>(new Set());
  const toggleGathered = (i: number) =>
    setGathered((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Hands are busy while mixing — don't let the screen sleep.
  useKeepAwake();
  const isComplete = currentStep >= totalSteps;
  // Progress segments: one for "gather ingredients" plus one per step.
  const segments = totalSteps + 1;

  useEffect(() => {
    if (timerRunning && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            haptics.success();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timer]);

  const showToast = useToastStore((s) => s.show);

  const goNext = () => {
    if (isComplete) {
      increment('chef');
      if (name && useChallengeStore.getState().completeIfMatches(name)) {
        increment('challenger');
        showToast('Weekly challenge complete', 'success');
      }
      router.back();
      return;
    }
    setCurrentStep((s) => s + 1);
    setTimer(0);
    setTimerRunning(false);
  };

  const goBack = () => {
    if (currentStep <= -1) {
      router.back();
      return;
    }
    setCurrentStep((s) => s - 1);
    setTimer(0);
    setTimerRunning(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stageLabel = isIngredientStep
    ? 'Gather ingredients'
    : isComplete
      ? 'All done'
      : `Step ${currentStep + 1} of ${totalSteps}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title={name || 'Preparation'} modal />

      {/* Progress */}
      <View style={styles.progress}>
        <View style={styles.segments} accessibilityRole="progressbar" accessibilityLabel={stageLabel}>
          {Array.from({ length: segments }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i <= currentStep + 1 ? theme.accent : theme.surfaceSecondary },
              ]}
            />
          ))}
        </View>
        <Text style={[typography.overline, styles.stageLabel, { color: theme.textSecondary }]}>{stageLabel}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isComplete && styles.contentCentered]}
        showsVerticalScrollIndicator={false}
      >
        {isIngredientStep ? (
          <Animated.View key="ingredients" entering={FadeIn.duration(200)}>
            <Text style={[styles.stepText, { color: theme.text }]}>You&apos;ll need</Text>
            <Text style={[typography.caption, { color: theme.textSecondary, marginTop: -spacing.lg, marginBottom: spacing.lg }]}>
              {gathered.size === ingredientsList.length
                ? 'All set — tap Start'
                : 'Tap each ingredient as you get it ready'}
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {ingredientsList.map((ing, i) => {
                const done = gathered.has(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      haptics.selection();
                      toggleGathered(i);
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    style={[
                      styles.ingRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                    ]}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={done ? theme.success : theme.textTertiary}
                    />
                    <Text
                      style={[
                        typography.body,
                        styles.ingName,
                        { color: done ? theme.textSecondary : theme.text, textDecorationLine: done ? 'line-through' : 'none' },
                      ]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={[styles.ingMeasure, { color: theme.textSecondary }]}>
                      {ing.measure ? formatMeasure(ing.measure) : 'To taste'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : isComplete ? (
          <Animated.View key="complete" entering={FadeIn.duration(200)} style={styles.complete}>
            <Ionicons name="checkmark-circle" size={64} color={theme.success} />
            <Text style={[styles.completeTitle, { color: theme.text }]}>Ready to serve</Text>
            <Text style={[typography.body, styles.completeSubtitle, { color: theme.textSecondary }]}>
              Your {name} is ready. Enjoy!
            </Text>
          </Animated.View>
        ) : (
          <Animated.View key={currentStep} entering={FadeIn.duration(200)}>
            <Text style={[styles.stepText, { color: theme.text }]}>{steps[currentStep]}</Text>

            {/* Timer */}
            <View style={[styles.timerCard, { backgroundColor: theme.surface }]}>
              <View style={styles.timerRow}>
                <IconButton
                  icon="remove"
                  size={44}
                  onPress={() => setTimer((t) => Math.max(0, t - 15))}
                  accessibilityLabel="Remove 15 seconds"
                />
                <Text style={[styles.timerText, { color: timer > 0 ? theme.text : theme.textTertiary }]}>
                  {formatTime(timer)}
                </Text>
                <IconButton
                  icon="add"
                  size={44}
                  onPress={() => setTimer((t) => t + 15)}
                  accessibilityLabel="Add 15 seconds"
                />
              </View>
              {timer > 0 && (
                <Button
                  title={timerRunning ? 'Pause' : 'Start timer'}
                  icon={timerRunning ? 'pause' : 'play'}
                  variant={timerRunning ? 'secondary' : 'tinted'}
                  fullWidth
                  onPress={() => setTimerRunning(!timerRunning)}
                />
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, spacing.lg), borderTopColor: theme.separator },
        ]}
      >
        <Button
          title="Back"
          icon="chevron-back"
          variant="secondary"
          size="lg"
          onPress={goBack}
          disabled={currentStep <= -1}
          style={styles.backBtn}
        />
        <Button
          title={isComplete ? 'Done' : isIngredientStep ? 'Start' : 'Next'}
          icon={isComplete ? 'checkmark' : undefined}
          size="lg"
          onPress={goNext}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: { paddingHorizontal: GUTTER, paddingTop: spacing.xs, paddingBottom: spacing.md },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  stageLabel: { marginTop: spacing.md },
  scroll: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: spacing['3xl'] },
  contentCentered: { flexGrow: 1, justifyContent: 'center' },
  stepText: { ...typography.h1, lineHeight: 36, marginBottom: spacing['2xl'] },
  card: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  ingName: { flex: 1 },
  ingMeasure: { ...typography.bodyBold, fontVariant: ['tabular-nums'], textAlign: 'right', maxWidth: '45%' },
  timerCard: { borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.lg },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerText: { ...typography.hero, fontSize: 40, lineHeight: 46, fontVariant: ['tabular-nums'] },
  complete: { alignItems: 'center', paddingBottom: spacing['4xl'] },
  completeTitle: { ...typography.h1, marginTop: spacing.lg, marginBottom: spacing.sm },
  completeSubtitle: { textAlign: 'center' },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
