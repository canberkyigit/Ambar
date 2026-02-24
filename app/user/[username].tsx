import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { useFollowStore } from '../../src/stores/useFollowStore';
import { typography, spacing, borderRadius } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * 2) / 3;

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

  const avatarColor = userPosts[0]?.avatarColor ?? theme.accent;
  const initial = (username ?? '?').charAt(0).toUpperCase();

  const totalLikes = useMemo(
    () => userPosts.reduce((sum, p) => sum + p.likeCount, 0),
    [userPosts],
  );

  const userRecipes = useMemo(() => {
    const seen = new Set<string>();
    return userPosts.filter((p) => {
      if (seen.has(p.cocktailId)) return false;
      seen.add(p.cocktailId);
      return true;
    });
  }, [userPosts]);

  const [activeTab, setActiveTab] = useState<'posts' | 'recipes'>('posts');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {username}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Profile Info */}
      <Animated.View entering={FadeInDown.springify()} style={styles.profileSection}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLargeText}>{initial}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{userPosts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{getFollowersCount(username ?? '')}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{getFollowingCount(username ?? '')}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={[styles.bioName, { color: theme.text }]}>{username}</Text>
        <Text style={[styles.bioText, { color: theme.textSecondary }]}>
          Cocktail enthusiast sharing recipes and vibes
        </Text>
      </View>

      {/* Follow button - only for other users */}
      {username !== 'you' && (
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.followRow}>
          <Pressable
            onPress={() => (isFollowing(username ?? '') ? unfollow(username ?? '') : follow(username ?? ''))}
            style={[
              styles.followBtn,
              isFollowing(username ?? '')
                ? { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
                : { backgroundColor: theme.accent },
            ]}
          >
            <Text
              style={[
                styles.followBtnText,
                { color: isFollowing(username ?? '') ? theme.text : '#FFF' },
              ]}
            >
              {isFollowing(username ?? '') ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
          <Pressable style={[styles.messageBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="chatbubble-outline" size={18} color={theme.text} />
          </Pressable>
        </Animated.View>
      )}

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => setActiveTab('posts')}
          style={[styles.tabItem, activeTab === 'posts' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? theme.text : theme.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('recipes')}
          style={[styles.tabItem, activeTab === 'recipes' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="wine-outline"
            size={22}
            color={activeTab === 'recipes' ? theme.text : theme.textTertiary}
          />
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        userPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Posts Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              This user hasn't shared anything yet
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {userPosts.map((post) => (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/post/${post.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )
      ) : (
        userRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wine-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recipes</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No cocktail recipes shared yet
            </Text>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {userRecipes.map((r) => (
              <Pressable
                key={r.cocktailId}
                onPress={() => router.push(`/cocktail/${r.cocktailId}`)}
                style={({ pressed }) => [
                  styles.recipeRow,
                  { backgroundColor: pressed ? theme.surface : 'transparent' },
                ]}
              >
                <Image source={{ uri: r.imageUrl }} style={styles.recipeThumb} />
                <View style={styles.recipeInfo}>
                  <Text style={[styles.recipeRowName, { color: theme.text }]} numberOfLines={1}>
                    {r.cocktailName}
                  </Text>
                  <Text style={[styles.recipeRowSub, { color: theme.textTertiary }]}>
                    Tap to view recipe
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        )
      )}
    </ScrollView>
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
  backBtn: {
    width: 28,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.small,
    marginTop: 1,
  },
  bioSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  bioName: {
    ...typography.captionBold,
  },
  bioText: {
    ...typography.caption,
    marginTop: 2,
  },
  followRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  followBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  followBtnText: {
    ...typography.captionBold,
    color: '#FFF',
  },
  messageBtn: {
    width: 40,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  recipeList: {
    paddingTop: spacing.xs,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  recipeThumb: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  recipeInfo: {
    flex: 1,
    gap: 2,
  },
  recipeRowName: {
    ...typography.bodyBold,
  },
  recipeRowSub: {
    ...typography.small,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  gridImage: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    resizeMode: 'cover',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
  },
});
