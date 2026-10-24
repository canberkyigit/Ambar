import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useJournalStore } from '../src/stores/useJournalStore';
import { EmptyState } from '../src/components/shared/EmptyState';
import { Button, IconButton, NavHeader, PressableScale } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { JournalEntry } from '../src/types/cocktail';

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  const { theme } = useThemeStore();
  return (
    <View style={styles.starsRow} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? theme.star : theme.textTertiary}
        />
      ))}
    </View>
  );
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { removeEntry } = useJournalStore();

  const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleLongPress = () => {
    Alert.alert('Delete entry', `Remove your tasting note for "${entry.cocktailName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);
  };

  return (
    <PressableScale
      onPress={() => router.push(`/cocktail/${entry.cocktailId}`)}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityHint="Opens the recipe. Long-press to delete this entry."
      style={[styles.entryCard, { backgroundColor: theme.surface }]}
    >
      <Image cachePolicy="memory-disk" transition={120} source={{ uri: `${entry.cocktailThumb}/preview` }} style={[styles.entryImage, { backgroundColor: theme.surfaceSecondary }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryTopRow}>
          <Text style={[styles.entryName, { color: theme.text }]} numberOfLines={1}>
            {entry.cocktailName}
          </Text>
          <Text style={[typography.caption, { color: theme.textTertiary }]}>{dateStr}</Text>
        </View>
        <StarRating rating={entry.rating} />
        {entry.notes ? (
          <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
            {entry.notes}
          </Text>
        ) : null}
      </View>
    </PressableScale>
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

  const addEntry = () => router.push('/journal/add');

  const statsCard = stats ? (
    <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
      {[
        { label: 'Entries', value: `${stats.total}` },
        { label: 'Avg rating', value: stats.average.toFixed(1), star: true },
        { label: 'Top pick', value: stats.mostReviewed },
      ].map((s, i) => (
        <View
          key={s.label}
          style={[styles.stat, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.separator }]}
        >
          <View style={styles.statValueRow}>
            {s.star && <Ionicons name="star" size={14} color={theme.star} />}
            <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
              {s.value}
            </Text>
          </View>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="Tasting journal"
        right={
          entries.length > 0 ? (
            <IconButton icon="add" variant="tinted" size={38} onPress={addEntry} accessibilityLabel="New entry" />
          ) : null
        }
      />

      {entries.length === 0 ? (
        <>
          <EmptyState
            icon="book-outline"
            title="No entries yet"
            subtitle="Rate the cocktails you try and jot down what you liked."
          />
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Button title="Add first entry" icon="add" size="lg" fullWidth onPress={addEntry} />
          </View>
        </>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} />}
          ListHeaderComponent={statsCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, gap: spacing.sm },
  statsCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm, gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  statValue: { ...typography.h3, flexShrink: 1 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  entryImage: { width: 64, height: 64, borderRadius: borderRadius.md },
  entryContent: { flex: 1, gap: 4 },
  entryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  entryName: { ...typography.bodyBold, flex: 1 },
  starsRow: { flexDirection: 'row', gap: 2 },
  bottomBar: { paddingHorizontal: GUTTER, paddingTop: spacing.md },
});
