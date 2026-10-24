import { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useAchievementStore, ACHIEVEMENTS } from '../src/stores/useAchievementStore';
import { CircularProgress } from '../src/components/shared/CircularProgress';
import { NavHeader } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { AchievementDef } from '../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - COLUMN_GAP) / 2;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const progress = useAchievementStore((s) => s.progress);
  const unlockedCount = useAchievementStore((s) => s.unlockedCount());

  const overallProgress = ACHIEVEMENTS.length > 0
    ? Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)
    : 0;

  const renderItem = useCallback(
    ({ item }: { item: AchievementDef }) => {
      const p = progress.find((x) => x.id === item.id) ?? { id: item.id, current: 0, unlockedAt: null };
      const unlocked = p.unlockedAt != null;
      const ratio = Math.min(p.current / item.target, 1);

      return (
        <View
          style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.surface }]}
          accessible
          accessibilityLabel={`${item.title}. ${item.description}. ${
            unlocked ? 'Unlocked' : `${p.current} of ${item.target}`
          }`}
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
              color={unlocked ? theme.onAccent : theme.textTertiary}
            />
          </View>

          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.progressSection}>
            {unlocked ? (
              <View style={styles.unlockedRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                <Text style={[typography.captionBold, { color: theme.success }]}>Unlocked</Text>
              </View>
            ) : (
              <>
                <View style={[styles.progressTrack, { backgroundColor: theme.surfaceSecondary }]}>
                  <View
                    style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: theme.accent }]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
                  {p.current}/{item.target}
                </Text>
              </>
            )}
          </View>
        </View>
      );
    },
    [theme, progress],
  );

  const summary = (
    <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
      <CircularProgress
        size={64}
        strokeWidth={6}
        progress={overallProgress / 100}
        color={theme.accent}
        bgColor={theme.surfaceSecondary}
      >
        <Text style={[typography.captionBold, { color: theme.text }]}>{overallProgress}%</Text>
      </CircularProgress>
      <View style={styles.summaryContent}>
        <Text style={[typography.h3, { color: theme.text }]}>
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
          {unlockedCount === ACHIEVEMENTS.length
            ? 'You have unlocked every achievement.'
            : 'Keep exploring, rating and mixing to earn the rest.'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Achievements" />

      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={progress}
        numColumns={2}
        ListHeaderComponent={summary}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryContent: { flex: 1 },
  row: { gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: 180,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.bodyBold },
  cardDesc: { ...typography.caption, marginTop: 2, marginBottom: spacing.md },
  progressSection: { marginTop: 'auto' },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { ...typography.caption, fontVariant: ['tabular-nums'] },
});
