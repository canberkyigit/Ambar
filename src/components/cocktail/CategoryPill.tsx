import { memo } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';

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

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
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
