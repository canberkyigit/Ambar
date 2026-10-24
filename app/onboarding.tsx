import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { Button } from '../src/components/ui';
import { typography, spacing, GUTTER } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOT = 8;
const DOT_ACTIVE = 24;

const SLIDES = [
  {
    key: '1',
    icon: 'wine' as const,
    title: 'Discover cocktails',
    subtitle: 'Explore recipes, ingredients, and step-by-step guides from around the world.',
  },
  {
    key: '2',
    icon: 'people' as const,
    title: 'Share with friends',
    subtitle: 'Post your creations, follow others, and find bars that serve your favorite drinks.',
  },
  {
    key: '3',
    icon: 'location' as const,
    title: 'Find bars nearby',
    subtitle: 'Search by cocktail, rate bars, and save your favorites for later.',
  },
];

function Dot({ i, scrollX, active, inactive }: { i: number; scrollX: SharedValue<number>; active: string; inactive: string }) {
  const style = useAnimatedStyle(() => {
    const distance = Math.min(Math.abs(scrollX.value / SCREEN_WIDTH - i), 1);
    return {
      width: DOT + (DOT_ACTIVE - DOT) * (1 - distance),
      backgroundColor: interpolateColor(distance, [0, 1], [active, inactive]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const finish = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={finish} hitSlop={12} style={styles.skipBtn} accessibilityRole="button">
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {SLIDES.map((item) => (
          <View key={item.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accentLight }]}>
              <Ionicons name={item.icon} size={72} color={theme.accent} />
            </View>
            <Text style={[styles.slideTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.slideSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <Dot key={s.key} i={i} scrollX={scrollX} active={theme.accent} inactive={theme.border} />
          ))}
        </View>
        <Button title={isLast ? 'Get started' : 'Next'} size="lg" fullWidth onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
  },
  skipBtn: { minHeight: 40, minWidth: 48, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { ...typography.bodyBold },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  iconWrap: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  slideTitle: { ...typography.hero, textAlign: 'center', marginBottom: spacing.md },
  slideSubtitle: { ...typography.body, textAlign: 'center', lineHeight: 23, maxWidth: 320 },
  footer: { paddingHorizontal: GUTTER },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing['2xl'] },
  dot: { height: DOT, borderRadius: DOT / 2 },
});
