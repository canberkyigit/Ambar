import { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAchievementStore, ACHIEVEMENTS } from '../../stores/useAchievementStore';
import { haptics } from '../../utils/haptics';
import { typography, spacing, borderRadius } from '../../theme';
import { Button } from '../ui';

const AUTO_DISMISS_MS = 4000;

export default function AchievementUnlock() {
  const { theme } = useThemeStore();
  const recentUnlock = useAchievementStore((s) => s.recentUnlock);
  const dismissUnlock = useAchievementStore((s) => s.dismissUnlock);

  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  const achievement = recentUnlock
    ? ACHIEVEMENTS.find((a) => a.id === recentUnlock)
    : null;

  const handleDismiss = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(dismissUnlock)();
      }
    });
  }, [scale, opacity, dismissUnlock]);

  useEffect(() => {
    if (recentUnlock) {
      haptics.success();
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });

      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    } else {
      scale.value = 0.92;
      opacity.value = 0;
    }
  }, [recentUnlock, handleDismiss, scale, opacity]);



  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!achievement) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: theme.overlay }, overlayStyle]}
      pointerEvents={recentUnlock ? 'auto' : 'none'}
      accessibilityViewIsModal
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} accessibilityLabel="Dismiss" />

      <Animated.View
        style={[styles.card, { backgroundColor: theme.elevated }, cardStyle]}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.accentLight }]}>
          <Ionicons
            name={achievement.icon as keyof typeof Ionicons.glyphMap}
            size={30}
            color={theme.accent}
          />
        </View>

        <Text style={[typography.overline, styles.unlockLabel, { color: theme.accent }]}>
          Achievement unlocked
        </Text>
        <Text style={[styles.achievementName, { color: theme.text }]}>{achievement.title}</Text>
        <Text style={[styles.achievementDesc, { color: theme.textSecondary }]}>
          {achievement.description}
        </Text>

        <Button title="Nice" size="lg" fullWidth onPress={handleDismiss} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  unlockLabel: {
    marginBottom: spacing.xs,
  },
  achievementName: {
    ...typography.h2,
    textAlign: 'center',
  },
  achievementDesc: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
});
