import { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { PostCard } from '../../src/components/social/PostCard';
import { NavHeader } from '../../src/components/ui';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { spacing } from '../../src/theme';

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useThemeStore();
  const { posts } = useSocialStore();

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Post" modal />
      {post ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
        >
          <PostCard post={post} defaultExpandComments />
        </ScrollView>
      ) : (
        <EmptyState
          icon="images-outline"
          title="Post not available"
          subtitle="It may have been deleted. Go back to see the latest posts."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
