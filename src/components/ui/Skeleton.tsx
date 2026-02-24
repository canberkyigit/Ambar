import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { borderRadius as br } from '../../theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = br.md, style }: SkeletonProps) {
  const { theme } = useThemeStore();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CocktailCardSkeleton() {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Skeleton width="100%" height={160} borderRadius={br.lg} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/** Single row skeleton for cocktail list (image + 2 lines). */
export function CocktailListRowSkeleton() {
  return (
    <View style={listRowStyles.row}>
      <Skeleton width={50} height={50} borderRadius={br.md} />
      <View style={listRowStyles.info}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const listRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  info: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: br.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 12,
  },
});
