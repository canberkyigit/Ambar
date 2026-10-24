import { useEffect, useRef } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../stores/useToastStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius, GUTTER } from '../../theme';

const ICON_MAP = {
  success: 'checkmark-circle' as const,
  error: 'alert-circle' as const,
  info: 'information-circle' as const,
};

export function Toast() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { toast, hide } = useToastStore();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
      opacity.value = withTiming(1, { duration: 200 });

      if (timerRef.current) clearTimeout(timerRef.current);
      const dur = toast.duration ?? 2500;
      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 250 });
        opacity.value = withDelay(100, withTiming(0, { duration: 150 }, () => runOnJS(hide)()));
      }, dur);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, hide, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  const iconName = ICON_MAP[toast.type];
  const iconColor = { success: theme.success, error: theme.error, info: theme.accent }[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          translateY.value = withTiming(-120, { duration: 200 });
          opacity.value = withDelay(50, withTiming(0, { duration: 150 }, () => runOnJS(hide)()));
        }}
        accessibilityRole="alert"
        accessibilityHint="Tap to dismiss"
        style={[
          styles.toast,
          { backgroundColor: theme.elevated, borderColor: theme.separator, shadowColor: theme.cardShadow },
        ]}
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
        <Text style={[styles.text, { color: theme.text }]}>{toast.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: GUTTER,
    right: GUTTER,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  text: {
    ...typography.bodyBold,
    flexShrink: 1,
  },
});
