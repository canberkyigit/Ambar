import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCollectionsStore } from '../src/stores/useCollectionsStore';
import { useAchievementStore } from '../src/stores/useAchievementStore';
import { typography, spacing, borderRadius } from '../src/theme';
import type { CocktailCollection } from '../src/types/cocktail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const EMOJI_OPTIONS = ['📚', '🍸', '🎉', '💝', '🌴', '🌙', '⭐', '🔥', '🍹', '👑'];
const PRESET_IDS = new Set(['summer', 'date_night', 'classic', 'easy']);

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
    ({ item, index }: { item: CocktailCollection; index: number }) => {
      const isPreset = PRESET_IDS.has(item.id);

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 60).springify()}
          style={{ width: CARD_WIDTH }}
        >
          <Pressable
            onPress={() => router.push(`/collection/${item.id}`)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: isPreset ? theme.accent + '10' : theme.surface,
                borderColor: isPreset ? theme.accent + '30' : 'transparent',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
              <Text style={[styles.cardCount, { color: theme.accent }]}>
                {item.cocktails.length}
              </Text>
              <Text style={[styles.cardCountLabel, { color: theme.textTertiary }]}>
                cocktails
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [theme, router],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Collections</Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Collection</Text>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>EMOJI</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiRowContent}
            >
              {EMOJI_OPTIONS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    styles.emojiOption,
                    {
                      backgroundColor: emoji === e ? theme.accent + '20' : theme.surfaceSecondary,
                      borderColor: emoji === e ? theme.accent : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
              placeholder="Collection name"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={30}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
              placeholder="A short description"
              placeholderTextColor={theme.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={60}
            />

            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: name.trim() ? theme.accent : theme.border, opacity: pressed ? 0.85 : 1 },
              ]}
              disabled={!name.trim()}
            >
              <Text style={styles.createBtnText}>Create Collection</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: { paddingBottom: 40 },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 170,
  },
  cardEmoji: { fontSize: 36, marginBottom: spacing.sm },
  cardName: { ...typography.captionBold, textAlign: 'center', marginBottom: 2 },
  cardDesc: { ...typography.small, textAlign: 'center', lineHeight: 15, color: '#999' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 'auto',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    justifyContent: 'center',
  },
  cardCount: { ...typography.bodyBold },
  cardCountLabel: { ...typography.small },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    paddingBottom: spacing['5xl'],
  },
  modalHandle: { alignItems: 'center', marginBottom: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2 },
  modalTitle: { ...typography.h3, marginBottom: spacing.xl },
  inputLabel: { ...typography.small, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.lg },
  emojiRowContent: { gap: spacing.sm },
  emojiOption: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  emojiText: { fontSize: 22 },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing['2xl'],
  },
  createBtnText: { ...typography.button, color: '#FFF' },
});
