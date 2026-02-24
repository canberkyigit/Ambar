import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAchievementStore, ACHIEVEMENTS } from '../../stores/useAchievementStore';
import { typography, spacing, borderRadius } from '../../theme';

const AUTO_DISMISS_MS = 4000;

export default function AchievementUnlock() {
  const { theme } = useThemeStore();
  const { recentUnlock, dismissUnlock } = useAchievementStore();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowScale = useSharedValue(0.6);

  const achievement = recentUnlock
    ? ACHIEVEMENTS.find((a) => a.id === recentUnlock)
    : null;

  useEffect(() => {
    if (recentUnlock) {
      opacity.value = withSpring(1);
      scale.value = withSpring(1, { damping: 10, stiffness: 120 });
      glowScale.value = withSpring(1.3, { damping: 8, stiffness: 80 });

      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      opacity.value = 0;
      glowScale.value = 0.6;
    }
  }, [recentUnlock]);

  const handleDismiss = () => {
    scale.value = withSpring(0, { damping: 15 });
    opacity.value = withDelay(150, withSpring(0, {}, (finished) => {
      if (finished) {
        runOnJS(dismissUnlock)();
      }
    }));
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: opacity.value * 0.5,
  }));

  if (!achievement) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents={recentUnlock ? 'auto' : 'none'}>
      <View style={styles.centered}>
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: theme.accent },
            glowStyle,
          ]}
        />

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.accent },
            cardStyle,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.accentLight }]}>
            <View style={[styles.iconInner, { backgroundColor: theme.accent }]}>
              <Ionicons
                name={achievement.icon as keyof typeof Ionicons.glyphMap}
                size={32}
                color="#FFFFFF"
              />
            </View>
          </View>

          <Text style={[styles.unlockLabel, { color: theme.accent }]}>
            Achievement Unlocked!
          </Text>
          <Text style={[styles.achievementName, { color: theme.text }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDesc, { color: theme.textSecondary }]}>
            {achievement.description}
          </Text>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              {
                backgroundColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.dismissText}>Awesome!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 9999,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  card: {
    width: 280,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockLabel: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  achievementName: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDesc: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  dismissButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['4xl'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  dismissText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
