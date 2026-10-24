import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCollectionsStore } from '../src/stores/useCollectionsStore';
import { useAchievementStore } from '../src/stores/useAchievementStore';
import { Button, IconButton, NavHeader, PressableScale, Sheet } from '../src/components/ui';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { CocktailCollection } from '../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - COLUMN_GAP) / 2;
const EMOJI_OPTIONS = ['📚', '🍸', '🎉', '💝', '🌴', '🌙', '⭐', '🔥', '🍹', '👑'];

export default function CollectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { collections, createCollection } = useCollectionsStore();
  const { increment } = useAchievementStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createCollection(name.trim(), description.trim(), emoji);
    increment('collector');
    setName('');
    setDescription('');
    setEmoji(EMOJI_OPTIONS[0]);
    setModalVisible(false);
  };

  const renderItem = useCallback(
    ({ item }: { item: CocktailCollection }) => {
      const count = item.cocktails.length;
      return (
        <PressableScale
          onPress={() => router.push(`/collection/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${count} ${count === 1 ? 'cocktail' : 'cocktails'}`}
          style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.surface }]}
        >
          <View style={[styles.emojiWell, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
          </View>
          <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.cardCount, { color: theme.textTertiary }]}>
            {count} {count === 1 ? 'cocktail' : 'cocktails'}
          </Text>
        </PressableScale>
      );
    },
    [theme, router],
  );

  const inputStyle = [styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }];
  const labelStyle = [styles.label, { color: theme.textSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader
        title="Collections"
        right={
          <IconButton
            icon="add"
            variant="tinted"
            size={38}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="New collection"
          />
        }
      />

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={modalVisible} onClose={() => setModalVisible(false)} title="New collection">
        <Text style={labelStyle}>Icon</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emojiRow}
          keyboardShouldPersistTaps="handled"
        >
          {EMOJI_OPTIONS.map((e) => {
            const selected = emoji === e;
            return (
              <Pressable
                key={e}
                onPress={() => {
                  haptics.selection();
                  setEmoji(e);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.emojiOption,
                  {
                    backgroundColor: selected ? theme.accentLight : theme.surfaceSecondary,
                    borderColor: selected ? theme.accent : 'transparent',
                  },
                ]}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[labelStyle, styles.fieldGap]}>Name</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. Brunch favorites"
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.accent}
          value={name}
          onChangeText={setName}
          maxLength={30}
          returnKeyType="next"
        />

        <Text style={[labelStyle, styles.fieldGap]}>Description</Text>
        <TextInput
          style={inputStyle}
          placeholder="A short description (optional)"
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.accent}
          value={description}
          onChangeText={setDescription}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <Button
          title="Create collection"
          size="lg"
          fullWidth
          onPress={handleCreate}
          disabled={!name.trim()}
          style={styles.createBtn}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm },
  row: { gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 168,
  },
  emojiWell: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardEmoji: { fontSize: 24 },
  cardDesc: { ...typography.caption, marginTop: 2 },
  cardCount: { ...typography.caption, marginTop: 'auto', paddingTop: spacing.md },
  label: { ...typography.captionBold, marginBottom: spacing.sm },
  fieldGap: { marginTop: spacing.lg },
  emojiRow: { gap: spacing.sm },
  emojiOption: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  emojiText: { fontSize: 22 },
  input: {
    ...typography.body,
    height: 46,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.md,
  },
  createBtn: { marginTop: spacing['2xl'] },
});
