import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { typography, spacing } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToOffset({ offset: (index + 1) * SCREEN_WIDTH, animated: true });
      setIndex(index + 1);
    } else {
      setHasSeenOnboarding(true);
      router.replace('/(tabs)');
    }
  };

  const skip = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <Pressable onPress={skip} style={[styles.skipBtn, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={onScroll}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name={item.icon} size={64} color={theme.accent} />
            </View>
            <Text style={[styles.slideTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.slideSubtitle, { color: theme.textSecondary }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? theme.accent : theme.surfaceSecondary,
                  width: i === index ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          style={[styles.nextBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.nextBtnText}>
            {index < SLIDES.length - 1 ? 'Next' : 'Get started'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 0, right: spacing.lg, zIndex: 1, padding: spacing.md },
  skipText: { ...typography.body },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  slideTitle: { ...typography.hero, textAlign: 'center', marginBottom: spacing.md },
  slideSubtitle: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.xl },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  nextBtnText: { ...typography.button, color: '#FFF' },
});
