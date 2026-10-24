import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useCustomRecipeStore } from '../../src/stores/useCustomRecipeStore';
import { useJournalStore } from '../../src/stores/useJournalStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { useFollowStore } from '../../src/stores/useFollowStore';
import { useUserProfileStore } from '../../src/stores/useUserProfileStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { useCollectionsStore } from '../../src/stores/useCollectionsStore';
import { useMyBarStore } from '../../src/stores/useMyBarStore';
import { useShoppingListStore } from '../../src/stores/useShoppingListStore';
import { useAchievementStore, ACHIEVEMENTS } from '../../src/stores/useAchievementStore';
import { MOCK_BARS } from '../../src/data/bars';
import { ScreenHeader, IconButton, Button } from '../../src/components/ui';
import { haptics } from '../../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER, TAB_BAR_CLEARANCE } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * 2) / 3;

type ViewMode = 'posts' | 'saved' | 'favorites' | 'bars';
type IconName = keyof typeof Ionicons.glyphMap;

const VIEW_TABS: { key: ViewMode; icon: IconName; iconActive: IconName; label: string }[] = [
  { key: 'posts', icon: 'grid-outline', iconActive: 'grid', label: 'Posts' },
  { key: 'saved', icon: 'bookmark-outline', iconActive: 'bookmark', label: 'Saved posts' },
  { key: 'favorites', icon: 'heart-outline', iconActive: 'heart', label: 'Favorite cocktails' },
  { key: 'bars', icon: 'map-outline', iconActive: 'map', label: 'Saved bars' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  // Field selectors keep this (often hidden) tab from re-rendering on unrelated store updates.
  const favorites = useFavoritesStore((s) => s.favorites);
  const recipeCount = useCustomRecipeStore((s) => s.recipes.length);
  const journalCount = useJournalStore((s) => s.entries.length);
  const posts = useSocialStore((s) => s.posts);
  const savedPosts = useSocialStore((s) => s.savedPosts);
  const followers = useFollowStore((s) => s.getFollowersCount('you'));
  const following = useFollowStore((s) => s.getFollowingCount('you'));
  const displayName = useUserProfileStore((s) => s.displayName);
  const bio = useUserProfileStore((s) => s.bio);
  const avatarUri = useUserProfileStore((s) => s.avatarUri);
  const savedBarIds = useBarsStore((s) => s.savedBarIds);
  const collectionCount = useCollectionsStore((s) => s.collections.length);
  const barCount = useMyBarStore((s) => s.ingredients.length);
  const shoppingCount = useShoppingListStore((s) => s.items.length);
  const unlocked = useAchievementStore((s) => s.unlockedCount());

  const [viewMode, setViewMode] = useState<ViewMode>('posts');

  const myPosts = posts.filter((p) => p.username === 'you');
  const mySaved = posts.filter((p) => savedPosts.includes(p.id));
  const mySavedBars = MOCK_BARS.filter((b) => savedBarIds.includes(b.id));

  const stats = [
    { label: 'Posts', value: myPosts.length },
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
  ];

  const library: { icon: IconName; label: string; detail: string; route: string }[] = [
    { icon: 'book-outline', label: 'My recipes', detail: `${recipeCount}`, route: '/my-recipes' },
    { icon: 'journal-outline', label: 'Tasting journal', detail: `${journalCount}`, route: '/journal' },
    { icon: 'albums-outline', label: 'Collections', detail: `${collectionCount}`, route: '/collections' },
    { icon: 'beaker-outline', label: 'My bar', detail: `${barCount}`, route: '/my-bar' },
    { icon: 'cart-outline', label: 'Shopping list', detail: `${shoppingCount}`, route: '/shopping-list' },
    { icon: 'trophy-outline', label: 'Achievements', detail: `${unlocked}/${ACHIEVEMENTS.length}`, route: '/achievements' },
    { icon: 'swap-vertical-outline', label: 'Unit converter', detail: '', route: '/unit-converter' },
  ];

  const renderEmpty = (icon: IconName, title: string, subtitle: string) => (
    <View style={styles.emptyGrid}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
        <Ionicons name={icon} size={26} color={theme.textSecondary} />
      </View>
      <Text style={[typography.bodyBold, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderGrid = (items: { key: string; uri: string; onPress: () => void }[]) => (
    <View style={styles.photoGrid}>
      {items.map((it) => (
        <Pressable key={it.key} onPress={it.onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Image cachePolicy="memory-disk" transition={120} source={{ uri: it.uri }} style={[styles.gridImage, { backgroundColor: theme.surface }]} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Profile"
        right={<IconButton icon="settings-outline" onPress={() => router.push('/settings')} accessibilityLabel="Settings" />}
      />

      {/* Identity */}
      <View style={styles.identity}>
        <Pressable onPress={() => router.push('/edit-profile')} accessibilityLabel="Edit profile photo">
          {avatarUri ? (
            <Image cachePolicy="memory-disk" transition={120} source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.avatarInitial, { color: theme.accent }]}>
                {(displayName || 'Y').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bio}>
        <Text style={[typography.h3, { color: theme.text }]}>{displayName}</Text>
        {!!bio && <Text style={[styles.bioText, { color: theme.textSecondary }]}>{bio}</Text>}
      </View>

      <View style={styles.actions}>
        <Button title="Edit profile" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push('/edit-profile')} />
        <Button title="New recipe" icon="add" variant="tinted" size="sm" style={{ flex: 1 }} onPress={() => router.push('/create-recipe')} />
      </View>

      {/* Library */}
      <Text style={[typography.overline, styles.groupLabel, { color: theme.textSecondary }]}>Library</Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {library.map((row, i) => (
          <Pressable
            key={row.route}
            onPress={() => router.push(row.route as never)}
            style={({ pressed }) => [styles.libraryRow, pressed && { backgroundColor: theme.surfaceSecondary }]}
            accessibilityRole="button"
          >
            <View style={[styles.libraryIcon, { backgroundColor: theme.accentLight }]}>
              <Ionicons name={row.icon} size={17} color={theme.accent} />
            </View>
            <View style={[styles.libraryBody, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator }]}>
              <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{row.label}</Text>
              {!!row.detail && <Text style={[typography.body, { color: theme.textTertiary }]}>{row.detail}</Text>}
              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Content tabs */}
      <View style={[styles.tabRow, { borderBottomColor: theme.separator }]}>
        {VIEW_TABS.map((t) => {
          const active = viewMode === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                haptics.selection();
                setViewMode(t.key);
              }}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={active ? t.iconActive : t.icon} size={22} color={active ? theme.text : theme.textTertiary} />
              <View style={[styles.tabIndicator, { backgroundColor: active ? theme.text : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      {viewMode === 'posts' ? (
        myPosts.length === 0
          ? renderEmpty('camera-outline', 'No posts yet', 'Share a photo of your next cocktail from the Feed.')
          : renderGrid(myPosts.map((p) => ({ key: p.id, uri: p.imageUrl, onPress: () => router.push(`/post/${p.id}`) })))
      ) : viewMode === 'saved' ? (
        mySaved.length === 0
          ? renderEmpty('bookmark-outline', 'No saved posts', 'Tap the bookmark on a post to save it here.')
          : renderGrid(mySaved.map((p) => ({ key: p.id, uri: p.imageUrl, onPress: () => router.push(`/post/${p.id}`) })))
      ) : viewMode === 'favorites' ? (
        favorites.length === 0
          ? renderEmpty('heart-outline', 'No favorites yet', 'Tap the heart on any cocktail to keep it here.')
          : renderGrid(favorites.map((f) => ({ key: f.idDrink, uri: `${f.strDrinkThumb}/preview`, onPress: () => router.push(`/cocktail/${f.idDrink}`) })))
      ) : mySavedBars.length === 0 ? (
        renderEmpty('map-outline', 'No saved bars', 'Save bars from the Bars tab to find them quickly.')
      ) : (
        <View style={[styles.card, { backgroundColor: theme.surface, marginTop: spacing.lg }]}>
          {mySavedBars.map((bar, i) => (
            <Pressable
              key={bar.id}
              onPress={() => router.push('/(tabs)/favorites')}
              style={({ pressed }) => [
                styles.barRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                pressed && { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: theme.text }]}>{bar.name}</Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>
                  {bar.city}, {bar.country}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    gap: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { ...typography.hero },
  statsRow: { flex: 1, flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h2, fontVariant: ['tabular-nums'] },
  statLabel: { ...typography.caption, marginTop: 1 },
  bio: { paddingHorizontal: GUTTER, paddingTop: spacing.md },
  bioText: { ...typography.body, marginTop: 2 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: GUTTER,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  groupLabel: { paddingHorizontal: GUTTER + spacing.xs, marginTop: spacing['2xl'], marginBottom: spacing.sm },
  card: { marginHorizontal: GUTTER, borderRadius: borderRadius.lg, overflow: 'hidden' },
  libraryRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md },
  libraryIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  libraryBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.md + 1,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: spacing['2xl'],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.md },
  tabIndicator: { height: 2, width: 28, borderRadius: 1, marginTop: spacing.md },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
    marginTop: GRID_SPACING,
  },
  gridImage: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, resizeMode: 'cover' },
  emptyGrid: { alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing['3xl'], gap: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  emptySubtitle: { ...typography.caption, textAlign: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
});
