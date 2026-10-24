import { memo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, runOnJS, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSocialStore } from '../../stores/useSocialStore';
import { useNotificationsStore } from '../../stores/useNotificationsStore';
import { typography, spacing, borderRadius, fontFamilies, GUTTER } from '../../theme';
import { haptics } from '../../utils/haptics';
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

const CURRENT_USERNAME = 'you';

interface PostCardProps {
  post: SocialPost;
  /** When true (e.g. on post detail screen), comments section is expanded by default. */
  defaultExpandComments?: boolean;
}

/** Memoized: liking one post must not re-render every other post in the feed. */
export const PostCard = memo(function PostCard({ post, defaultExpandComments = false }: PostCardProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  // Narrow selectors: this card only re-renders when its own like/save state changes.
  const liked = useSocialStore((s) => s.likedPosts.includes(post.id));
  const saved = useSocialStore((s) => s.savedPosts.includes(post.id));
  const toggleLike = useSocialStore((s) => s.toggleLike);
  const toggleSave = useSocialStore((s) => s.toggleSave);
  const addComment = useSocialStore((s) => s.addComment);
  const deletePost = useSocialStore((s) => s.deletePost);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [showComments, setShowComments] = useState(defaultExpandComments);
  const [commentText, setCommentText] = useState('');

  const heartScale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Big heart that pops over the photo on double-tap.
  const burst = useSharedValue(0);
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [{ scale: 0.6 + burst.value * 0.4 }],
  }));

  const likeFromDoubleTap = () => {
    if (!liked) handleLike();
    else haptics.tap();
    // Quick pop: in ~120ms, brief hold, out ~140ms (≈400ms total).
    burst.value = withSequence(
      withTiming(1, { duration: 120, easing: Easing.out(Easing.back(2)) }),
      withDelay(140, withTiming(0, { duration: 140 })),
    );
  };

  const openPost = () => router.push(`/post/${post.id}`);
  const imageGesture = Gesture.Exclusive(
    // Short window so a single tap (open post) isn't held back long waiting for a second tap.
    Gesture.Tap().numberOfTaps(2).maxDelay(220).onEnd(() => runOnJS(likeFromDoubleTap)()),
    Gesture.Tap().onEnd(() => runOnJS(openPost)()),
  );

  const handleLike = () => {
    if (!liked) haptics.tap();
    heartScale.value = withSequence(
      withTiming(1.25, { duration: 90 }),
      withTiming(1, { duration: 110 }),
    );
    toggleLike(post.id);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    addComment(post.id, text);
    setCommentText('');
    // Notify post owner when someone else comments (not when you comment on your own post).
    if (post.username !== CURRENT_USERNAME) {
      addNotification({
        type: 'comment',
        title: 'New comment',
        body: `${CURRENT_USERNAME}: "${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        username: CURRENT_USERNAME,
        postId: post.id,
      });
    }
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
    <View style={styles.card}>
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
            style={[styles.cocktailBadge, { backgroundColor: theme.accentLight }]}
          >
            <Ionicons name="wine-outline" size={12} color={theme.accent} />
            <Text style={[styles.cocktailBadgeText, { color: theme.accent }]} numberOfLines={1}>
              {post.cocktailName}
            </Text>
          </Pressable>
          {post.username === 'you' && (
            <Pressable onPress={handleMorePress} hitSlop={8} style={styles.moreBtn} accessibilityLabel="Post options">
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Image */}
      <GestureDetector gesture={imageGesture}>
        <View
          accessible
          accessibilityRole="imagebutton"
          accessibilityLabel={`${post.cocktailName} by ${post.username}`}
          accessibilityHint="Opens the post"
        >
          <Image cachePolicy="memory-disk" transition={120} recyclingKey={post.id} source={{ uri: post.imageUrl }} style={[styles.postImage, { backgroundColor: theme.surface }]} />
          <Animated.View pointerEvents="none" style={[styles.burst, burstStyle]}>
            <Ionicons name="heart" size={96} color="#FFFFFF" />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} hitSlop={8} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
            <Animated.View style={heartStyle}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? theme.heart : theme.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => setShowComments(!showComments)} hitSlop={8} accessibilityLabel="Comments">
            <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => toggleSave(post.id)} hitSlop={8} accessibilityLabel={saved ? 'Unsave' : 'Save'}>
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
              <Text style={styles.commentUsername}>{c.username} </Text>
              {c.text}
            </Text>
          ))}
          <View style={[styles.commentInput, { backgroundColor: theme.surfaceSecondary }]}>
            <TextInput
              style={[styles.commentField, { color: theme.text }]}
              placeholder="Add a comment…"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
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
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: spacing.md,
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
    fontFamily: fontFamilies.bold,
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
  username: { ...typography.bodyBold },
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
  burst: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  likeCount: {
    ...typography.captionBold,
    paddingHorizontal: GUTTER,
    marginBottom: spacing.xs,
  },
  captionRow: {
    ...typography.body,
    paddingHorizontal: GUTTER,
    lineHeight: 21,
  },
  captionUsername: { fontFamily: fontFamilies.bold, fontWeight: '700' },
  viewComments: {
    ...typography.caption,
    paddingHorizontal: GUTTER,
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  commentsSection: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  commentText: {
    ...typography.body,
    lineHeight: 21,
  },
  commentUsername: {
    fontFamily: fontFamilies.bold,
    fontWeight: '700',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 40,
    marginTop: spacing.sm,
  },
  commentField: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  postBtn: {
    ...typography.captionBold,
    marginLeft: spacing.sm,
  },
});
