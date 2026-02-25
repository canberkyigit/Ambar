import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useFavoritesStore } from '../../src/stores/useFavoritesStore';
import { useCustomRecipeStore } from '../../src/stores/useCustomRecipeStore';
import { useJournalStore } from '../../src/stores/useJournalStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { useFollowStore } from '../../src/stores/useFollowStore';
import { useUserProfileStore } from '../../src/stores/useUserProfileStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { MOCK_BARS } from '../../src/data/bars';
import { typography, spacing, borderRadius } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * 2) / 3;

type ViewMode = 'posts' | 'saved' | 'favorites' | 'bars';

export default function ProfileScreen() {
  const router = useRouter();
  const { paddingTop: headerPadding } = useHeaderPadding();
  const { theme } = useThemeStore();
  const { favorites } = useFavoritesStore();
  const { recipes } = useCustomRecipeStore();
  const { entries } = useJournalStore();
  const { posts, savedPosts } = useSocialStore();
  const { getFollowersCount, getFollowingCount } = useFollowStore();
  const { displayName, bio, avatarUri } = useUserProfileStore();
  const { savedBarIds } = useBarsStore();

  const [viewMode, setViewMode] = useState<ViewMode>('posts');

  const myPosts = posts.filter((p) => p.username === 'you');
  const mySaved = posts.filter((p) => savedPosts.includes(p.id));
  const mySavedBars = MOCK_BARS.filter((b) => savedBarIds.includes(b.id));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPadding }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={[styles.gearBtn, { backgroundColor: theme.surface, marginRight: spacing.xs }]}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.gearBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Profile Info */}
      <Animated.View entering={FadeInDown.springify()} style={styles.profileSection}>
        <Pressable onPress={() => router.push('/edit-profile')}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarLarge} />
          ) : (
            <View style={[styles.avatarLarge, { backgroundColor: theme.accent }]}>
              <Ionicons name="person" size={36} color="#FFF" />
            </View>
          )}
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{myPosts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{getFollowersCount('you')}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{getFollowingCount('you')}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{favorites.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{recipes.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recipes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{entries.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Journal</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={[styles.bioName, { color: theme.text }]}>{displayName}</Text>
        <Text style={[styles.bioText, { color: theme.textSecondary }]}>{bio}</Text>
      </View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.quickActions}>
        <Pressable
          onPress={() => router.push('/create-recipe')}
          style={[styles.actionBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>Create Recipe</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/my-recipes')}
          style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
        >
          <Text style={[styles.actionBtnTextSecondary, { color: theme.text }]}>My Recipes</Text>
        </Pressable>
      </Animated.View>

      {/* Tab Switch */}
      <View style={[styles.tabRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => setViewMode('posts')}
          style={[styles.tab, viewMode === 'posts' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={viewMode === 'posts' ? theme.text : theme.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={() => setViewMode('saved')}
          style={[styles.tab, viewMode === 'saved' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="bookmark-outline"
            size={22}
            color={viewMode === 'saved' ? theme.text : theme.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={() => setViewMode('favorites')}
          style={[styles.tab, viewMode === 'favorites' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="heart-outline"
            size={22}
            color={viewMode === 'favorites' ? theme.text : theme.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={() => setViewMode('bars')}
          style={[styles.tab, viewMode === 'bars' && { borderBottomColor: theme.text }]}
        >
          <Ionicons
            name="location-outline"
            size={22}
            color={viewMode === 'bars' ? theme.text : theme.textTertiary}
          />
        </Pressable>
      </View>

      {/* Grid Content */}
      {viewMode === 'posts' ? (
        myPosts.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name="camera-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Posts Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Share your cocktail photos from the Feed tab
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {myPosts.map((post) => (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/post/${post.id}`)}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )
      ) : viewMode === 'saved' ? (
        mySaved.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name="bookmark-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Posts</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Bookmark posts from the Feed to save them here
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {mySaved.map((post) => (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/post/${post.id}`)}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )
      ) : viewMode === 'favorites' ? (
        favorites.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name="heart-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Favorites</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Save your favorite cocktails to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {favorites.map((fav) => (
              <Pressable
                key={fav.idDrink}
                onPress={() => router.push(`/cocktail/${fav.idDrink}`)}
              >
                <Image source={{ uri: fav.strDrinkThumb }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )
      ) : (
        mySavedBars.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name="location-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved bars</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Save bars from the Bars tab to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.barsList}>
            {mySavedBars.map((bar) => (
              <Pressable
                key={bar.id}
                onPress={() => router.push('/(tabs)/favorites')}
                style={[styles.barRow, { backgroundColor: theme.surface }]}
              >
                <View style={[styles.barRowIcon, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="location" size={20} color={theme.accent} />
                </View>
                <View style={styles.barRowInfo}>
                  <Text style={[styles.barRowName, { color: theme.text }]}>{bar.name}</Text>
                  <Text style={[styles.barRowPlace, { color: theme.textSecondary }]}>{bar.city}, {bar.country}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
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
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    fontWeight: '700',
    flex: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionBtnText: {
    ...typography.captionBold,
    color: '#FFF',
  },
  actionBtnTextSecondary: {
    ...typography.captionBold,
  },
  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
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
  emptyGrid: {
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
  barsList: { padding: spacing.lg, gap: spacing.sm },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  barRowIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barRowInfo: { flex: 1 },
  barRowName: { ...typography.bodyBold },
  barRowPlace: { ...typography.small, marginTop: 2 },
});
