import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { PostCard } from '../../src/components/social/PostCard';
import { typography, spacing, borderRadius } from '../../src/theme';
import type { SocialPost } from '../../src/types/cocktail';

export default function FeedScreen() {
  const { paddingTop: headerPadding } = useHeaderPadding();
  const navigation = useNavigation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { posts } = useSocialStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<SocialPost>>(null);

  const POSTS_PER_PAGE = 10;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.cocktailName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q),
      );
    }
    return list;
  }, [posts, searchQuery]);

  const visiblePosts = useMemo(
    () => filteredPosts.slice(0, page * POSTS_PER_PAGE),
    [filteredPosts, page],
  );
  const hasMore = visiblePosts.length < filteredPosts.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const headerComponent = (
    <View style={styles.headerWrap}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPadding }]}>
        <View style={styles.logoRow}>
          <Text style={[styles.logo, { color: theme.text }]}>A M B A R</Text>
          <Ionicons name="wine" size={24} color={theme.text} />
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/create-post')} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="add-circle-outline" size={26} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search posts by cocktail, user..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.separator, { backgroundColor: theme.border }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        ListHeaderComponent={headerComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
        ListEmptyComponent={
          searchQuery.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                No posts found for "{searchQuery}"
              </Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={40} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Share your first cocktail photo from the + button
              </Text>
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          hasMore && visiblePosts.length > 0 ? (
            <Pressable onPress={loadMore} style={styles.loadMoreWrap}>
              <Text style={[styles.loadMoreText, { color: theme.accent }]}>Load more posts</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    ...typography.h1,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.caption,
    padding: 0,
  },
  separator: {
    height: 0.5,
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
  },
  loadMoreWrap: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadMoreText: { ...typography.captionBold },
});
