import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useUserProfileStore } from '../src/stores/useUserProfileStore';
import { typography, spacing, borderRadius } from '../src/theme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { displayName, bio, avatarUri, updateProfile } = useUserProfileStore();

  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const save = useCallback(() => {
    setSaving(true);
    updateProfile({ displayName: name, bio: bioText });
    setSaving(false);
    router.back();
  }, [name, bioText, updateProfile, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit profile</Text>
        <Pressable onPress={saving ? undefined : save} hitSlop={12}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={[styles.doneText, { color: theme.accent }]}>Done</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Pressable onPress={pickImage} style={styles.avatarSection}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
              <Ionicons name="person" size={48} color={theme.textTertiary} />
            </View>
          )}
          <Text style={[styles.changePhotoText, { color: theme.accent }]}>Change photo</Text>
        </Pressable>

        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { color: theme.text }]}
            value={bioText}
            onChangeText={setBioText}
            placeholder="Tell us about yourself"
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
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
  cancelText: { ...typography.body },
  title: { ...typography.h3 },
  doneText: { ...typography.bodyBold },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: { ...typography.captionBold, marginTop: spacing.sm },
  field: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { ...typography.small, marginBottom: spacing.xs },
  input: { ...typography.body, padding: 0 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
});
