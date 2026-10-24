import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useShoppingListStore, type ShoppingListItem } from '../src/stores/useShoppingListStore';
import { useToastStore } from '../src/stores/useToastStore';
import { formatMeasure } from '../src/utils/formatMeasure';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import { EmptyState } from '../src/components/shared/EmptyState';
import { Button, IconButton, NavHeader } from '../src/components/ui';

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { items, removeItem, clearList, getListForCopy } = useShoppingListStore();
  const showToast = useToastStore((s) => s.show);

  // Group items by the cocktail they came from, keeping insertion order.
  const groups = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>();
    for (const item of items) {
      const list = map.get(item.cocktailId);
      if (list) list.push(item);
      else map.set(item.cocktailId, [item]);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleCopy = async () => {
    const text = getListForCopy();
    await Clipboard.setStringAsync(text);
    haptics.success();
    showToast('Shopping list copied', 'success');
  };

  const handleShare = () => {
    const text = getListForCopy();
    Share.share({ message: text, title: 'Shopping list' });
  };

  const handleClear = () => {
    Alert.alert(
      'Clear list?',
      'Remove all items from the shopping list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearList },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="Shopping list"
        right={
          items.length > 0 && (
            <>
              <IconButton icon="copy-outline" size={38} onPress={handleCopy} accessibilityLabel="Copy list" />
              <IconButton icon="share-outline" size={38} onPress={handleShare} accessibilityLabel="Share list" />
            </>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your list is empty"
          subtitle="Open a cocktail and tap “Add to shopping list” to collect its ingredients here."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
        >
          {groups.map(([cocktailId, groupItems]) => (
            <View key={cocktailId} style={styles.group}>
              <Text style={[typography.overline, styles.groupLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                {groupItems[0].cocktailName}
              </Text>
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                {groupItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                    ]}
                  >
                    <Text style={[typography.body, styles.itemName, { color: theme.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {!!item.measure && (
                      <Text style={[styles.itemMeasure, { color: theme.textSecondary }]} numberOfLines={1}>
                        {formatMeasure(item.measure)}
                      </Text>
                    )}
                    <IconButton
                      icon="close"
                      variant="plain"
                      size={36}
                      color={theme.textTertiary}
                      onPress={() => removeItem(item.id)}
                      accessibilityLabel={`Remove ${item.name}`}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Button title="Clear list" icon="trash-outline" variant="destructive" fullWidth onPress={handleClear} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm },
  group: { marginBottom: spacing['2xl'] },
  groupLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  itemName: { flex: 1 },
  itemMeasure: { ...typography.bodyBold, fontVariant: ['tabular-nums'], maxWidth: '40%' },
});
