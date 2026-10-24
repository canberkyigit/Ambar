import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useChallengeStore } from '../../stores/useChallengeStore';
import { useToastStore } from '../../stores/useToastStore';
import { cocktailService } from '../../services/cocktailService';
import { typography, spacing, borderRadius, GUTTER } from '../../theme';
import { Button } from '../ui/Button';

function getDaysRemaining(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
}

/** This week's cocktail. Completed automatically by finishing it in step-by-step mode. */
export default function WeeklyChallenge() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { current, ensureCurrentChallenge } = useChallengeStore();
  const showToast = useToastStore((s) => s.show);
  const [searching, setSearching] = useState(false);

  const daysLeft = useMemo(() => getDaysRemaining(), []);

  useEffect(() => {
    ensureCurrentChallenge();
  }, [ensureCurrentChallenge]);

  const handleTryCocktail = async () => {
    if (!current) return;
    setSearching(true);
    try {
      const results = await cocktailService.searchByName(current.cocktailName);
      if (results.length > 0) {
        router.push(`/cocktail/${results[0].idDrink}`);
      } else {
        showToast("Couldn't find this week's cocktail", 'error');
      }
    } catch {
      showToast("Couldn't load this week's cocktail", 'error');
    } finally {
      setSearching(false);
    }
  };

  if (!current) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={styles.topRow}>
        <Text style={[typography.overline, { color: theme.accent, flex: 1 }]}>Weekly challenge</Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>
          {current.completed ? 'Done' : daysLeft === 0 ? 'Last day' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
        </Text>
      </View>
      <Text style={[typography.h2, { color: theme.text, marginTop: spacing.xs }]}>{current.title}</Text>
      <Text style={[typography.body, { color: theme.textSecondary, marginTop: 2 }]}>
        {current.description}: <Text style={{ color: theme.text }}>{current.cocktailName}</Text>
      </Text>

      {current.completed ? (
        <View style={[styles.done, { backgroundColor: theme.success + '1A' }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          <Text style={[typography.captionBold, { color: theme.success }]}>Completed — see you next week</Text>
        </View>
      ) : (
        <>
          <Button
            title={`Make a ${current.cocktailName}`}
            icon="arrow-forward"
            variant="tinted"
            fullWidth
            loading={searching}
            onPress={handleTryCocktail}
            style={{ marginTop: spacing.lg }}
          />
          <Text style={[typography.small, { color: theme.textTertiary, textAlign: 'center', marginTop: spacing.sm }]}>
            Finish it in step-by-step mode to complete the challenge
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: GUTTER,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
});
