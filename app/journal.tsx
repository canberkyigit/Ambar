import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useJournalStore } from '../src/stores/useJournalStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../src/theme';
import type { JournalEntry } from '../src/types/cocktail';

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

function EntryCard({ entry, index }: { entry: JournalEntry; index: number }) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { removeEntry } = useJournalStore();

  const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleLongPress = () => {
    Alert.alert(
      'Delete Entry',
      `Remove your tasting note for "${entry.cocktailName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeEntry(entry.id) },
      ],
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={() => router.push(`/cocktail/${entry.cocktailId}`)}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.entryCard,
          {
            backgroundColor: theme.surface,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Image source={{ uri: `${entry.cocktailThumb}/preview` }} style={styles.entryImage} />
        <View style={styles.entryContent}>
          <View style={styles.entryTopRow}>
            <Text style={[styles.entryName, { color: theme.text }]} numberOfLines={1}>
              {entry.cocktailName}
            </Text>
            <Text style={[styles.entryDate, { color: theme.textTertiary }]}>{dateStr}</Text>
          </View>
          <StarRating rating={entry.rating} />
          {entry.notes ? (
            <Text style={[styles.entryNotes, { color: theme.textSecondary }]} numberOfLines={1}>
              {entry.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { entries, averageRating } = useJournalStore();

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const avg = averageRating();
    const cocktailCounts: Record<string, number> = {};
    entries.forEach((e) => {
      cocktailCounts[e.cocktailName] = (cocktailCounts[e.cocktailName] || 0) + 1;
    });
    const mostReviewed = Object.entries(cocktailCounts).sort((a, b) => b[1] - a[1])[0];
    return { total: entries.length, average: avg, mostReviewed: mostReviewed ? mostReviewed[0] : '—' };
  }, [entries, averageRating]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Tasting Journal</Text>
        <Pressable
          onPress={() => router.push('/journal/add')}
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {stats && (
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.statsRow}>
            {[
              { label: 'Entries', value: `${stats.total}`, color: '#3B82F6' },
              { label: 'Avg Rating', value: stats.average.toFixed(1), color: '#F59E0B' },
              { label: 'Top Pick', value: stats.mostReviewed, color: '#10B981' },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No entries yet"
          subtitle="Start your tasting journey by adding your first note"
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <EntryCard entry={item} index={index} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: 2,
  },
  statValue: { ...typography.bodyBold },
  statLabel: { ...typography.small },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  entryCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  entryImage: { width: 72, height: 72, resizeMode: 'cover' },
  entryContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 3,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryName: { ...typography.captionBold, flex: 1, marginRight: spacing.sm },
  starsRow: { flexDirection: 'row', gap: 1 },
  entryNotes: { ...typography.small, marginTop: 1 },
  entryDate: { ...typography.small },
});
