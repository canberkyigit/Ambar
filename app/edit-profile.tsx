import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useUserProfileStore } from '../src/stores/useUserProfileStore';
import { NavHeader, Button } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';

const AVATAR_SIZE = 96;

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

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.surfaceSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Edit profile" modal />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={pickImage}
            style={styles.avatarSection}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
                <Ionicons name="person" size={44} color={theme.textTertiary} />
              </View>
            )}
            <Text style={[styles.changePhotoText, { color: theme.accent }]}>Change photo</Text>
          </Pressable>

          <View style={styles.field}>
            <Text style={[typography.overline, styles.label, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={[typography.overline, styles.label, { color: theme.textSecondary }]}>Bio</Text>
            <TextInput
              style={[inputStyle, styles.bioInput]}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Tell people what you like to mix"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, spacing.lg), borderTopColor: theme.separator },
          ]}
        >
          <Button title="Save" size="lg" fullWidth loading={saving} onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: spacing.lg, paddingBottom: spacing['2xl'] },
  avatarSection: { alignItems: 'center', alignSelf: 'center', marginBottom: spacing['2xl'] },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  changePhotoText: { ...typography.captionBold, marginTop: spacing.md },
  field: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  input: {
    ...typography.body,
    height: 46,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  bioInput: {
    height: undefined,
    minHeight: 110,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
  },
  bottomBar: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
