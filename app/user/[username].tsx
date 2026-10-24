import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { useFollowStore } from '../../src/stores/useFollowStore';
import { NavHeader, Button } from '../../src/components/ui';
import { haptics } from '../../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * 2) / 3;

type Tab = 'posts' | 'recipes';
type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { key: Tab; icon: IconName; iconActive: IconName; label: string }[] = [
  { key: 'posts', icon: 'grid-outline', iconActive: 'grid', label: 'Posts' },
  { key: 'recipes', icon: 'wine-outline', iconActive: 'wine', label: 'Cocktails' },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { theme } = useThemeStore();
  const { posts } = useSocialStore();
  const { follow, unfollow, isFollowing, getFollowersCount, getFollowingCount } = useFollowStore();

  const userPosts = useMemo(
    () => posts.filter((p) => p.username === username),
    [posts, username],
  );

  // Post authors carry their own avatar colour (white initial reads on it); fall back to the tinted accent like the Profile tab.
  const postAvatarColor = userPosts[0]?.avatarColor;
  const initial = (username ?? '?').charAt(0).toUpperCase();

  const userRecipes = useMemo(() => {
    const seen = new Set<string>();
    return userPosts.filter((p) => {
      if (seen.has(p.cocktailId)) return false;
      seen.add(p.cocktailId);
      return true;
    });
  }, [userPosts]);

  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const user = username ?? '';
  const following = isFollowing(user);

  const stats = [
    { label: 'Posts', value: userPosts.length },
    { label: 'Followers', value: getFollowersCount(user) },
    { label: 'Following', value: getFollowingCount(user) },
  ];

  const renderEmpty = (icon: IconName, title: string, subtitle: string) => (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
        <Ionicons name={icon} size={26} color={theme.textSecondary} />
      </View>
      <Text style={[typography.bodyBold, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title={username} />
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: postAvatarColor ?? theme.accentLight }]}>
            <Text style={[styles.avatarInitial, { color: postAvatarColor ? '#FFFFFF' : theme.accent }]}>{initial}</Text>
          </View>
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
          <Text style={[typography.h3, { color: theme.text }]}>{username}</Text>
          <Text style={[styles.bioText, { color: theme.textSecondary }]}>
            Cocktail enthusiast sharing recipes and vibes
          </Text>
        </View>

        {/* Follow — only for other users */}
        {username !== 'you' && (
          <View style={styles.actions}>
            <Button
              title={following ? 'Following' : 'Follow'}
              icon={following ? 'checkmark' : undefined}
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              fullWidth
              onPress={() => (following ? unfollow(user) : follow(user))}
            />
          </View>
        )}

        {/* Content tabs */}
        <View style={[styles.tabRow, { borderBottomColor: theme.separator }]}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(t.key);
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

        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            renderEmpty('camera-outline', 'No posts yet', `When ${username} shares a cocktail, it will show up here.`)
          ) : (
            <View style={styles.photoGrid}>
              {userPosts.map((post) => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/post/${post.id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Image cachePolicy="memory-disk" transition={120} source={{ uri: post.imageUrl }} style={[styles.gridImage, { backgroundColor: theme.surface }]} />
                </Pressable>
              ))}
            </View>
          )
        ) : userRecipes.length === 0 ? (
          renderEmpty('wine-outline', 'No cocktails yet', 'Cocktails from their posts will be listed here.')
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {userRecipes.map((r, i) => (
              <Pressable
                key={r.cocktailId}
                onPress={() => router.push(`/cocktail/${r.cocktailId}`)}
                style={({ pressed }) => [styles.recipeRow, pressed && { backgroundColor: theme.surfaceSecondary }]}
                accessibilityRole="button"
              >
                <Image cachePolicy="memory-disk" transition={120} source={{ uri: r.imageUrl }} style={[styles.recipeThumb, { backgroundColor: theme.surfaceSecondary }]} />
                <View
                  style={[
                    styles.recipeBody,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                  ]}
                >
                  <Text style={[typography.bodyBold, styles.flex, { color: theme.text }]} numberOfLines={1}>
                    {r.cocktailName}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
  actions: { paddingHorizontal: GUTTER, marginTop: spacing.lg },
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
  card: { marginHorizontal: GUTTER, marginTop: spacing.lg, borderRadius: borderRadius.lg, overflow: 'hidden' },
  recipeRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md },
  recipeThumb: { width: 44, height: 44, borderRadius: borderRadius.sm },
  recipeBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
    paddingRight: spacing.md,
    minHeight: 64,
  },
  empty: { alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing['3xl'], gap: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  emptySubtitle: { ...typography.caption, textAlign: 'center' },
});
