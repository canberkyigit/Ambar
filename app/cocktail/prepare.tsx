import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { typography, spacing, borderRadius } from '../../src/theme';
import { Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const steps = stepsParam ? JSON.parse(stepsParam) : [];
  const ingredientsList: { name: string; measure: string }[] = ingredientsParam
    ? JSON.parse(ingredientsParam)
    : [];
  const [currentStep, setCurrentStep] = useState(-1);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const totalSteps = steps.length;
  const isIngredientStep = currentStep === -1;
  const isComplete = currentStep >= totalSteps;

  useEffect(() => {
    if (timerRunning && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timer]);

  const goNext = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isComplete) {
      increment('chef');
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
          {name || 'Preparation'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.surfaceSecondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.accent,
              width: `${((currentStep + 1) / (totalSteps + 1)) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {isIngredientStep ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.stepContent}>
            <View style={[styles.stepBadge, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="list" size={28} color={theme.accent} />
            </View>
            <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>GATHER INGREDIENTS</Text>
            <View style={styles.ingredientsBox}>
              {ingredientsList.map((ing, i) => (
                <View key={i} style={[styles.ingRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.ingName, { color: theme.text }]}>{ing.name}</Text>
                  <Text style={[styles.ingMeasure, { color: theme.accent }]}>{ing.measure}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : isComplete ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.stepContent}>
            <View style={[styles.stepBadge, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={[styles.completeTitle, { color: theme.text }]}>Ready to Serve!</Text>
            <Text style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
              Your {name} is ready. Enjoy!
            </Text>
          </Animated.View>
        ) : (
          <Animated.View key={currentStep} entering={SlideInRight.springify()} style={styles.stepContent}>
            <View style={[styles.stepBadge, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.stepNumber, { color: theme.accent }]}>{currentStep + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
              STEP {currentStep + 1} OF {totalSteps}
            </Text>
            <Text style={[styles.stepText, { color: theme.text }]}>{steps[currentStep]}</Text>

            {/* Timer */}
            <View style={styles.timerSection}>
              <View style={styles.timerRow}>
                <Pressable onPress={() => setTimer((t) => Math.max(0, t - 15))} style={[styles.timerBtn, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.timerBtnText, { color: theme.text }]}>-15s</Text>
                </Pressable>
                <Text style={[styles.timerText, { color: timer > 0 ? theme.accent : theme.textTertiary }]}>
                  {formatTime(timer)}
                </Text>
                <Pressable onPress={() => setTimer((t) => t + 15)} style={[styles.timerBtn, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.timerBtnText, { color: theme.text }]}>+15s</Text>
                </Pressable>
              </View>
              {timer > 0 && (
                <Pressable
                  onPress={() => setTimerRunning(!timerRunning)}
                  style={[styles.timerToggle, { backgroundColor: timerRunning ? theme.error : theme.accent }]}
                >
                  <Ionicons name={timerRunning ? 'pause' : 'play'} size={18} color="#FFF" />
                  <Text style={styles.timerToggleText}>{timerRunning ? 'Pause' : 'Start'}</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          onPress={goBack}
          style={[styles.navBtn, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
          <Text style={[styles.navBtnText, { color: theme.text }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          style={[styles.navBtn, styles.nextBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.navBtnText, { color: '#FFF' }]}>
            {isComplete ? 'Done' : 'Next'}
          </Text>
          <Ionicons name={isComplete ? 'checkmark' : 'chevron-forward'} size={22} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  topTitle: { ...typography.h3, flex: 1, textAlign: 'center', marginHorizontal: spacing.md },
  progressBar: { height: 4, marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  stepContent: { alignItems: 'center' },
  stepBadge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  stepNumber: { fontSize: 28, fontWeight: '800' },
  stepLabel: { ...typography.small, letterSpacing: 2, marginBottom: spacing.lg },
  stepText: { ...typography.h2, textAlign: 'center', lineHeight: 34 },
  completeTitle: { ...typography.hero, marginBottom: spacing.sm },
  completeSubtitle: { ...typography.body, textAlign: 'center' },
  ingredientsBox: { width: '100%', marginTop: spacing.lg },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  ingName: { ...typography.body },
  ingMeasure: { ...typography.bodyBold },
  timerSection: { marginTop: spacing['3xl'], alignItems: 'center', gap: spacing.md },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  timerBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  timerBtnText: { ...typography.captionBold },
  timerText: { fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  timerToggleText: { ...typography.button, color: '#FFF' },
  bottomBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.xl, gap: spacing.xs },
  nextBtn: {},
  navBtnText: { ...typography.button },
});
