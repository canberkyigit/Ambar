import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useNotificationsStore, type AppNotification } from '../src/stores/useNotificationsStore';
import { typography, spacing } from '../src/theme';

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

  return (
    <Pressable
      onPress={() => {
        markAsRead(item.id);
        onPress?.();
      }}
      style={[
        styles.item,
        { backgroundColor: item.read ? 'transparent' : theme.accent + '08' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
        <Ionicons
          name={iconName as 'heart'}
          size={22}
          color={item.type === 'like' ? '#EF4444' : theme.accent}
        />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.itemBodyText, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.itemTime, { color: theme.textTertiary }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { items, markAllAsRead, unreadCount } = useNotificationsStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {unreadCount() > 0 ? (
          <Pressable onPress={() => markAllAsRead()} style={styles.markAll}>
            <Text style={[styles.markAllText, { color: theme.accent }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            When someone likes or comments on your posts, you'll see them here
          </Text>
        </View>
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
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.border }]} />}
        />
      )}
    </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36 },
  title: { ...typography.h2 },
  markAll: { padding: spacing.xs },
  markAllText: { ...typography.captionBold },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemTitle: { ...typography.bodyBold, marginBottom: 2 },
  itemBodyText: { ...typography.caption },
  itemTime: { ...typography.small, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg + 44 + spacing.md },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: { ...typography.h3, marginTop: spacing.lg },
  emptySub: { ...typography.body, marginTop: spacing.sm, textAlign: 'center' },
});
