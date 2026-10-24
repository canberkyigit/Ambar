import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter , useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useSocialStore } from '../src/stores/useSocialStore';
import { useCocktailPickerStore } from '../src/stores/useCocktailPickerStore';
import { NavHeader, Button, IconButton, PressableScale } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';

// Avatar colours for the generated post author — data, not theme.
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

  const inputBase = { color: theme.text, backgroundColor: theme.surfaceSecondary };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="New post" modal />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!imageUri ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <PressableScale
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel="Select photo"
                style={[styles.pickerArea, { backgroundColor: theme.surface }]}
              >
                <View style={[styles.pickerIconWrap, { backgroundColor: theme.accentLight }]}>
                  <Ionicons name="images-outline" size={34} color={theme.accent} />
                </View>
                <Text style={[styles.pickerTitle, { color: theme.text }]}>Select a photo</Text>
                <Text style={[styles.pickerHint, { color: theme.textSecondary }]}>
                  Pick a square shot of your drink from your library
                </Text>
              </PressableScale>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} style={styles.form}>
              <View>
                <Image source={{ uri: imageUri }} style={[styles.previewImage, { backgroundColor: theme.surfaceSecondary }]} />
                <IconButton
                  icon="camera-outline"
                  variant="scrim"
                  size={38}
                  onPress={pickImage}
                  accessibilityLabel="Change photo"
                  style={styles.changePhotoBtn}
                />
              </View>

              <View>
                <Text style={[typography.overline, styles.label, { color: theme.textSecondary }]}>Caption</Text>
                <TextInput
                  style={[styles.input, styles.captionInput, inputBase]}
                  placeholder="Write a caption…"
                  placeholderTextColor={theme.textTertiary}
                  selectionColor={theme.accent}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text style={[typography.overline, styles.label, { color: theme.textSecondary }]}>Cocktail</Text>
                <View style={styles.cocktailRow}>
                  <TextInput
                    style={[styles.input, styles.cocktailInput, inputBase]}
                    placeholder="Name (optional)"
                    placeholderTextColor={theme.textTertiary}
                    selectionColor={theme.accent}
                    value={cocktailName}
                    onChangeText={setCocktailName}
                  />
                  <Button
                    title="Choose"
                    icon="wine-outline"
                    variant="tinted"
                    onPress={() => router.push('/pick-cocktail')}
                  />
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, spacing.lg), borderTopColor: theme.separator },
          ]}
        >
          <Button
            title="Share"
            size="lg"
            fullWidth
            loading={isSharing}
            disabled={!imageUri}
            onPress={handleShare}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
  pickerArea: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pickerTitle: { ...typography.h3, marginBottom: spacing.xs },
  pickerHint: { ...typography.caption, textAlign: 'center' },
  form: { gap: spacing.xl },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  changePhotoBtn: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  input: {
    ...typography.body,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  captionInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cocktailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cocktailInput: { flex: 1, height: 46 },
  bottomBar: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
