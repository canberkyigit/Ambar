import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = 120;

interface SwipeCardProps {
  cocktail: {
    idDrink: string;
    strDrink: string;
    strDrinkThumb: string;
    strCategory?: string;
    strAlcoholic?: string;
    strGlass?: string;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({ cocktail, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const { theme } = useThemeStore();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const toRight = translateX.value > 0;
        translateX.value = withTiming(
          (toRight ? 1 : -1) * SCREEN_WIDTH * 1.5,
          { duration: 300 },
          (finished) => {
            if (finished) {
              if (toRight) {
                runOnJS(onSwipeRight)();
              } else {
                runOnJS(onSwipeLeft)();
              }
            }
          },
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle, { shadowColor: theme.cardShadow }]}>
        <Image source={{ uri: cocktail.strDrinkThumb }} style={styles.image} />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <Text style={styles.name}>{cocktail.strDrink}</Text>
          {(cocktail.strCategory || cocktail.strAlcoholic) && (
            <Text style={styles.meta}>
              {[cocktail.strCategory, cocktail.strAlcoholic].filter(Boolean).join(' · ')}
            </Text>
          )}
        </LinearGradient>

        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing['5xl'],
    justifyContent: 'flex-end',
  },
  name: {
    ...typography.h1,
    color: '#FFFFFF',
  },
  meta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  overlay: {
    position: 'absolute',
    top: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderRadius: borderRadius.md,
  },
  likeOverlay: {
    left: spacing.xl,
    borderColor: '#22C55E',
    transform: [{ rotate: '-15deg' }],
  },
  nopeOverlay: {
    right: spacing.xl,
    borderColor: '#EF4444',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    ...typography.h1,
    color: '#22C55E',
  },
  nopeText: {
    ...typography.h1,
    color: '#EF4444',
  },
});
