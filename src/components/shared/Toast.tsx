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
import { typography, spacing, borderRadius } from '../../theme';

const ICON_MAP = {
  success: 'checkmark-circle' as const,
  error: 'alert-circle' as const,
  info: 'information-circle' as const,
};

const COLOR_MAP = {
  success: '#34C759',
  error: '#FF3B30',
  info: '#5E5CE6',
};

export function Toast() {
  const insets = useSafeAreaInsets();
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
  const iconColor = COLOR_MAP[toast.type];

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
        style={styles.toast}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
        <Text style={styles.text}>{toast.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  text: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    flexShrink: 1,
  },
});
