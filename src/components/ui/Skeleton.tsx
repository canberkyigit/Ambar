import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
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
  }, [shimmer]);

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

const CARD_WIDTH = (Dimensions.get('window').width - 16 * 2 - 12) / 2;

/** Matches the layout of CocktailCard (photo + name). */
export function CocktailCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={CARD_WIDTH * 1.1} borderRadius={br.lg} />
      <Skeleton width="65%" height={14} style={{ marginTop: 10 }} />
    </View>
  );
}

/** Single row skeleton for cocktail list (image + 2 lines). */
export function CocktailListRowSkeleton() {
  return (
    <View style={listRowStyles.row}>
      <Skeleton width={56} height={56} borderRadius={br.md} />
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
    paddingVertical: 8,
    gap: 14,
  },
  info: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
});
