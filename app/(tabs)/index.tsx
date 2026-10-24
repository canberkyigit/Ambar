import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import { useNavigation, useRouter } from 'expo-router';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { useNotificationsStore } from '../../src/stores/useNotificationsStore';
import { PostCard } from '../../src/components/social/PostCard';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { IconButton, SearchField } from '../../src/components/ui';
import { typography, spacing, fontFamilies, GUTTER, TAB_BAR_CLEARANCE } from '../../src/theme';
import type { SocialPost } from '../../src/types/cocktail';

export default function FeedScreen() {
  const { paddingTop: headerPadding } = useHeaderPadding();
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const posts = useSocialStore((s) => s.posts);
  const unread = useNotificationsStore((s) => s.items.filter((n) => !n.read).length);
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

  const renderPost = useCallback(({ item }: { item: SocialPost }) => <PostCard post={item} />, []);

  const headerComponent = (
    <View style={styles.headerWrap}>
      <View style={[styles.header, { paddingTop: headerPadding }]}>
        <Text style={[styles.logo, { color: theme.text }]} accessibilityRole="header">
          ambar<Text style={{ color: theme.accent }}>.</Text>
        </Text>
        <View style={styles.headerRight}>
          <IconButton icon="add" onPress={() => router.push('/create-post')} accessibilityLabel="New post" />
          <IconButton
            icon="notifications-outline"
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications"
            badge={unread}
          />
        </View>
      </View>

      <SearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search posts, cocktails, people"
        style={styles.search}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={headerComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {searchQuery.trim().length > 0 ? (
              <EmptyState icon="search-outline" title="No matching posts" subtitle={`Nothing found for “${searchQuery.trim()}”.`} />
            ) : (
              <EmptyState icon="images-outline" title="No posts yet" subtitle="Share your first cocktail photo with the + button." />
            )}
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        ListFooterComponent={
          hasMore && visiblePosts.length > 0 ? (
            <Pressable onPress={loadMore} style={styles.loadMoreWrap}>
              <Text style={[styles.loadMoreText, { color: theme.accent }]}>Load more posts</Text>
            </Pressable>
          ) : null
        }
        renderItem={renderPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingBottom: spacing.md,
  },
  logo: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    letterSpacing: -1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  search: { paddingHorizontal: GUTTER },
  empty: { paddingTop: spacing['4xl'] },
  loadMoreWrap: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadMoreText: { ...typography.captionBold },
});
