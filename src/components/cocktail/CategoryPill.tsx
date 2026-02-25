import { memo, useEffect } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';

const springConfig = { damping: 18, stiffness: 200 };

interface CategoryPillProps {
  name: string;
  selected?: boolean;
  index?: number;
  onPress: () => void;
}

export const CategoryPill = memo(function CategoryPill({
  name,
  selected = false,
  index = 0,
  onPress,
}: CategoryPillProps) {
  const { theme } = useThemeStore();
  const selectedValue = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedValue.value = withSpring(selected ? 1 : 0, springConfig);
  }, [selected, selectedValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + 0.08 * selectedValue.value }],
    opacity: 0.88 + 0.12 * selectedValue.value,
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          style={[
            styles.pill,
            {
              backgroundColor: selected ? theme.accent : theme.surfaceSecondary,
              borderColor: selected ? theme.accent : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              { color: selected ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {name}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  text: {
    ...typography.captionBold,
  },
});
