import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useSocialStore } from '../src/stores/useSocialStore';
import { useCocktailPickerStore } from '../src/stores/useCocktailPickerStore';
import { typography, spacing, borderRadius } from '../src/theme';

const AVATAR_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { addPost } = useSocialStore();
  const { pendingSelection, clearPendingSelection } = useCocktailPickerStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [cocktailName, setCocktailName] = useState('');
  const [cocktailId, setCocktailId] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (pendingSelection) {
        setCocktailName(pendingSelection.name);
        setCocktailId(pendingSelection.id);
        clearPendingSelection();
      }
    }, [pendingSelection, clearPendingSelection]),
  );

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!imageUri) return;
    setIsSharing(true);
    try {
      addPost({
        username: 'you',
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        cocktailName: cocktailName.trim() || 'My Cocktail',
        cocktailId: cocktailId || '11007',
        imageUrl: imageUri,
        caption: caption.trim() || 'Sharing my latest creation! 🍸',
      });
      router.back();
    } finally {
      setIsSharing(false);
    }
  }, [imageUri, caption, cocktailName, cocktailId, addPost, router]);

  const canShare = Boolean(imageUri) && !isSharing;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header - Instagram style */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Post</Text>
        <Pressable
          onPress={handleShare}
          disabled={!canShare}
          hitSlop={12}
          style={[styles.headerBtn, styles.headerBtnRight]}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text
              style={[
                styles.shareText,
                { color: canShare ? theme.accent : theme.textTertiary },
              ]}
            >
              Share
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!imageUri ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerWrap}>
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [
                  styles.pickerArea,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.pickerIconWrap, { backgroundColor: theme.accent + '18' }]}>
                  <Ionicons name="images-outline" size={48} color={theme.accent} />
                </View>
                <Text style={[styles.pickerTitle, { color: theme.text }]}>Select photo</Text>
                <Text style={[styles.pickerHint, { color: theme.textSecondary }]}>
                  Add a photo to share
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(250).springify()} style={styles.form}>
              <View style={styles.previewRow}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <View style={styles.fieldsColumn}>
                  <TextInput
                    style={[
                      styles.captionInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Write a caption..."
                    placeholderTextColor={theme.textTertiary}
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <View style={styles.cocktailRow}>
                    <TextInput
                      style={[
                        styles.cocktailInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Cocktail name (optional)"
                      placeholderTextColor={theme.textTertiary}
                      value={cocktailName}
                      onChangeText={setCocktailName}
                    />
                    <Pressable
                      onPress={() => router.push('/pick-cocktail')}
                      style={({ pressed }) => [
                        styles.selectCocktailBtn,
                        {
                          backgroundColor: theme.accent + '18',
                          borderColor: theme.accent,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="wine-outline" size={18} color={theme.accent} />
                      <Text style={[styles.selectCocktailBtnText, { color: theme.accent }]}>
                        Select cocktail
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={pickImage}
                style={[styles.changePhotoBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="camera-outline" size={18} color={theme.accent} />
                <Text style={[styles.changePhotoText, { color: theme.accent }]}>Change photo</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 64, alignItems: 'flex-start' },
  headerBtnRight: { alignItems: 'flex-end' },
  headerTitle: {
    ...typography.h3,
  },
  cancelText: { ...typography.body },
  shareText: { ...typography.bodyBold },
  pickerWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing['4xl'] },
  pickerArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pickerTitle: { ...typography.h3, marginBottom: spacing.xs },
  pickerHint: { ...typography.caption },
  form: { gap: spacing.lg },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  fieldsColumn: { flex: 1, gap: spacing.md },
  captionInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
  },
  cocktailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cocktailInput: {
    ...typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectCocktailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  selectCocktailBtnText: {
    ...typography.captionBold,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  changePhotoText: { ...typography.captionBold },
});
