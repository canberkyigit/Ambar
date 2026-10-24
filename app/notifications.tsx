import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useNotificationsStore, type AppNotification } from '../src/stores/useNotificationsStore';
import { NavHeader, IconButton } from '../src/components/ui';
import { EmptyState } from '../src/components/shared/EmptyState';
import { typography, spacing, GUTTER } from '../src/theme';

const ICON_SIZE = 40;

function formatTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress?: () => void;
}) {
  const { theme } = useThemeStore();
  const { markAsRead } = useNotificationsStore();
  const iconName =
    item.type === 'like'
      ? 'heart'
      : item.type === 'comment'
        ? 'chatbubble'
        : item.type === 'follow'
          ? 'person-add'
          : 'at';
  const isLike = item.type === 'like';

  return (
    <Pressable
      onPress={() => {
        markAsRead(item.id);
        onPress?.();
      }}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.surfaceSecondary }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isLike ? theme.heart + '1F' : theme.accentLight }]}>
        <Ionicons name={iconName as 'heart'} size={19} color={isLike ? theme.heart : theme.accent} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.titleRow}>
          <Text
            style={[item.read ? typography.body : typography.bodyBold, styles.itemTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.itemTime, { color: theme.textTertiary }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={[styles.itemBodyText, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <View style={[styles.unreadDot, { backgroundColor: item.read ? 'transparent' : theme.accent }]} />
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { items, markAllAsRead, unreadCount } = useNotificationsStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="Notifications"
        right={
          unreadCount() > 0 ? (
            <IconButton
              icon="checkmark-done"
              variant="plain"
              size={38}
              color={theme.accent}
              onPress={() => markAllAsRead()}
              accessibilityLabel="Mark all as read"
            />
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications yet"
          subtitle="Share a post on the Feed — likes, comments and new followers will show up here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={item.postId ? () => router.push(`/post/${item.postId}`) : undefined}
            />
          )}
          contentContainerStyle={{ paddingTop: spacing.xs, paddingBottom: insets.bottom + spacing['2xl'] }}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.separator }]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  itemTitle: { flex: 1 },
  itemBodyText: { ...typography.caption, lineHeight: 18 },
  itemTime: { ...typography.small },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: GUTTER + ICON_SIZE + spacing.md },
});
