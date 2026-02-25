import { View, Text, StyleSheet, Pressable, ScrollView, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useShoppingListStore } from '../src/stores/useShoppingListStore';
import { typography, spacing, borderRadius } from '../src/theme';
import { EmptyState } from '../src/components/shared/EmptyState';

export default function ShoppingListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { items, removeItem, clearList, getListForCopy } = useShoppingListStore();

  const handleCopy = async () => {
    const text = getListForCopy();
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Shopping list copied to clipboard.');
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
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Shopping list</Text>
        <View style={styles.headerRight}>
          {items.length > 0 && (
            <>
              <Pressable onPress={handleCopy} hitSlop={8} style={styles.headerBtn}>
                <Ionicons name="copy-outline" size={22} color={theme.text} />
              </Pressable>
              <Pressable onPress={handleShare} hitSlop={8} style={styles.headerBtn}>
                <Ionicons name="share-outline" size={22} color={theme.text} />
              </Pressable>
              <Pressable onPress={handleClear} hitSlop={8} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={22} color={theme.text} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="List is empty"
          subtitle="Add ingredients from cocktail detail with “Add to shopping list”"
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 30).springify()}
              style={[styles.row, { backgroundColor: theme.surface }]}
            >
              <View style={styles.rowContent}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: theme.textTertiary }]}>
                  {item.measure ? `${item.measure} · ` : ''}{item.cocktailName}
                </Text>
              </View>
              <Pressable onPress={() => removeItem(item.id)} hitSlop={8} style={styles.removeBtn}>
                <Ionicons name="close-circle-outline" size={22} color={theme.textTertiary} />
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
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
  },
  title: { ...typography.h2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerBtn: { padding: spacing.xs },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  rowContent: { flex: 1 },
  itemName: { ...typography.bodyBold },
  itemMeta: { ...typography.small, marginTop: 2 },
  removeBtn: { padding: spacing.xs },
});
