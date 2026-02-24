import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useAchievementStore, ACHIEVEMENTS } from '../src/stores/useAchievementStore';
import { typography, spacing, borderRadius } from '../src/theme';
import type { AchievementDef } from '../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { progress, getProgress, isUnlocked } = useAchievementStore();

  const unlockedCount = useMemo(
    () => progress.filter((p) => p.unlockedAt != null).length,
    [progress],
  );

  const overallProgress = ACHIEVEMENTS.length > 0
    ? Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)
    : 0;

  const renderItem = useCallback(
    ({ item, index }: { item: AchievementDef; index: number }) => {
      const p = getProgress(item.id);
      const unlocked = isUnlocked(item.id);
      const ratio = Math.min(p.current / item.target, 1);

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 50).springify()}
          style={{ width: CARD_WIDTH }}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: unlocked ? theme.accent + '10' : theme.surface,
                borderColor: unlocked ? theme.accent + '40' : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: unlocked ? theme.accent : theme.surfaceSecondary },
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={unlocked ? '#FFF' : theme.textTertiary}
              />
            </View>

            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.progressSection}>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${ratio * 100}%`,
                      backgroundColor: unlocked ? theme.success : theme.accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
                {p.current}/{item.target}
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    },
    [theme, getProgress, isUnlocked],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
        <View style={{ width: 28 }} />
      </View>

      <Animated.View entering={FadeInDown.springify()} style={styles.summarySection}>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.accent + '18' }]}>
            <Ionicons name="trophy" size={24} color={theme.accent} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              {unlockedCount} of {ACHIEVEMENTS.length}
            </Text>
            <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
              achievements unlocked
            </Text>
          </View>
          <View style={[styles.progressCircle, { borderColor: theme.accent }]}>
            <Text style={[styles.progressPercent, { color: theme.accent }]}>{overallProgress}%</Text>
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2 },
  summarySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  summaryIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryContent: { flex: 1 },
  summaryTitle: { ...typography.bodyBold },
  summarySubtitle: { ...typography.small, marginTop: 2 },
  progressCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  progressPercent: { ...typography.captionBold },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: { paddingBottom: 40 },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 180,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.captionBold, textAlign: 'center', marginBottom: 2 },
  cardDesc: { ...typography.small, textAlign: 'center', lineHeight: 15, marginBottom: spacing.md },
  progressSection: { width: '100%', marginTop: 'auto' },
  progressTrack: {
    height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { ...typography.small, textAlign: 'center' },
});
