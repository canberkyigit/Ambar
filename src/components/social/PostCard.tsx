import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSocialStore } from '../../stores/useSocialStore';
import { typography, spacing, borderRadius } from '../../theme';
import type { SocialPost } from '../../types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface PostCardProps {
  post: SocialPost;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { toggleLike, isLiked, addComment, toggleSave, isSaved, deletePost } = useSocialStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const liked = isLiked(post.id);
  const saved = isSaved(post.id);
  const heartScale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withSpring(1, { damping: 8 }),
    );
    toggleLike(post.id);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleMorePress = () => {
    Alert.alert(
      'Post options',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete post',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete post?',
              'This post will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePost(post.id) },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[styles.card, { backgroundColor: theme.surface }]}
    >
      {/* User Header */}
      <View style={styles.userRow}>
        <Pressable
          style={styles.userRowLeft}
          onPress={() => {
            if (post.username === 'you') {
              router.push('/(tabs)/profile');
            } else {
              router.push(`/user/${post.username}`);
            }
          }}
        >
          <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
            <Text style={styles.avatarText}>
              {post.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: theme.text }]}>{post.username}</Text>
            <Text style={[styles.timeAgo, { color: theme.textTertiary }]}>{timeAgo(post.timestamp)}</Text>
          </View>
        </Pressable>
        <View style={styles.userRowRight}>
          <Pressable
            onPress={() => router.push(`/cocktail/${post.cocktailId}`)}
            style={[styles.cocktailBadge, { backgroundColor: theme.accent + '15' }]}
          >
            <Ionicons name="wine-outline" size={12} color={theme.accent} />
            <Text style={[styles.cocktailBadgeText, { color: theme.accent }]} numberOfLines={1}>
              {post.cocktailName}
            </Text>
          </Pressable>
          {post.username === 'you' && (
            <Pressable onPress={handleMorePress} hitSlop={8} style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Image */}
      <Pressable onPress={() => router.push(`/post/${post.id}`)}>
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      </Pressable>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} hitSlop={8}>
            <Animated.View style={heartStyle}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? '#EF4444' : theme.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => setShowComments(!showComments)} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => toggleSave(post.id)} hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={theme.text}
          />
        </Pressable>
      </View>

      {/* Like Count */}
      <Text style={[styles.likeCount, { color: theme.text }]}>
        {post.likeCount.toLocaleString()} likes
      </Text>

      {/* Caption */}
      <Text style={[styles.captionRow, { color: theme.text }]}>
        <Text style={styles.captionUsername}>{post.username} </Text>
        {post.caption}
      </Text>

      {/* Comments Preview */}
      {post.comments.length > 0 && !showComments && (
        <Pressable onPress={() => setShowComments(true)}>
          <Text style={[styles.viewComments, { color: theme.textTertiary }]}>
            View all {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}

      {/* Expanded Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {post.comments.map((c) => (
            <Text key={c.id} style={[styles.commentText, { color: theme.text }]}>
              <Text style={styles.captionUsername}>{c.username} </Text>
              {c.text}
            </Text>
          ))}
          <View style={[styles.commentInput, { backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.commentField, { color: theme.text }]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
              returnKeyType="send"
            />
            {commentText.trim().length > 0 && (
              <Pressable onPress={handleComment}>
                <Text style={[styles.postBtn, { color: theme.accent }]}>Post</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userInfo: { flex: 1 },
  userRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moreBtn: {
    padding: spacing.xs,
  },
  username: { ...typography.captionBold },
  timeAgo: { ...typography.small, marginTop: 1 },
  cocktailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
    maxWidth: 130,
  },
  cocktailBadgeText: { ...typography.small, fontWeight: '600' },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  likeCount: {
    ...typography.captionBold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  captionRow: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  captionUsername: { fontWeight: '700' },
  viewComments: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  commentsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  commentText: {
    ...typography.caption,
    lineHeight: 18,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  commentField: {
    flex: 1,
    ...typography.caption,
    padding: 0,
  },
  postBtn: {
    ...typography.captionBold,
    marginLeft: spacing.sm,
  },
});
