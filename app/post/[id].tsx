import { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useSocialStore } from '../../src/stores/useSocialStore';
import { PostCard } from '../../src/components/social/PostCard';

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useThemeStore();
  const { posts } = useSocialStore();

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <PostCard post={post} index={0} defaultExpandComments />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
