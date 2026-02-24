import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useChallengeStore } from '../../stores/useChallengeStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { cocktailService } from '../../services/cocktailService';
import { typography, spacing, borderRadius } from '../../theme';

function getDaysRemaining(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
}

export default function WeeklyChallenge() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { current, ensureCurrentChallenge, completeChallenge } = useChallengeStore();
  const { increment } = useAchievementStore();
  const [searching, setSearching] = useState(false);

  const daysLeft = useMemo(() => getDaysRemaining(), []);

  useEffect(() => {
    ensureCurrentChallenge();
  }, []);

  const handleTryCocktail = async () => {
    if (!current) return;
    setSearching(true);
    try {
      const results = await cocktailService.searchByName(current.cocktailName);
      if (results.length > 0) {
        router.push(`/cocktail/${results[0].idDrink}`);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleComplete = () => {
    completeChallenge();
    increment('challenger');
  };

  if (!current) return null;

  return (
    <Animated.View entering={FadeInDown.delay(150).springify()}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.accent + '18' }]}>
            <Ionicons name="trophy" size={20} color={theme.accent} />
          </View>
          <View style={styles.topText}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>WEEKLY CHALLENGE</Text>
            <Text style={[styles.title, { color: theme.text }]}>{current.title}</Text>
          </View>
          <View style={[styles.daysBadge, { backgroundColor: theme.accent + '15' }]}>
            <Text style={[styles.daysText, { color: theme.accent }]}>
              {daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {current.description}
        </Text>

        <Pressable
          onPress={handleTryCocktail}
          disabled={searching}
          style={[styles.cocktailRow, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="wine" size={16} color={theme.accent} />
          <Text style={[styles.cocktailName, { color: theme.text }]} numberOfLines={1}>
            {current.cocktailName}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
        </Pressable>

        {current.completed ? (
          <View style={[styles.completedRow, { backgroundColor: `${theme.success}15` }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            <Text style={[styles.completedText, { color: theme.success }]}>Challenge complete!</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.completeBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.completeBtnText}>Mark Complete</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  topText: { flex: 1 },
  label: { ...typography.small, textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...typography.bodyBold, marginTop: 2 },
  daysBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  daysText: { ...typography.captionBold },
  description: { ...typography.caption, marginBottom: spacing.md, lineHeight: 18 },
  cocktailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  cocktailName: { ...typography.captionBold, flex: 1 },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  completedText: { ...typography.captionBold },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  completeBtnText: { ...typography.captionBold, color: '#FFF' },
});
