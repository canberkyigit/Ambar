import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useJournalStore } from '../../src/stores/useJournalStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { cocktailService } from '../../src/services/cocktailService';
import { typography, spacing, borderRadius } from '../../src/theme';
import { useDebounce } from '../../src/hooks/useDebounce';
import type { Cocktail } from '../../src/types/cocktail';

export default function AddJournalEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { addEntry } = useJournalStore();
  const { increment } = useAchievementStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cocktail[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 400);

  const handleSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await cocktailService.searchByName(debouncedQuery);
      setSearchResults(results.slice(0, 8));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery]);

  const handleSelectCocktail = useCallback((cocktail: Cocktail) => {
    setSelectedCocktail(cocktail);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedCocktail) {
      Alert.alert('Select a Cocktail', 'Please search and select a cocktail first.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Add a Rating', 'Please tap a star to rate this cocktail.');
      return;
    }

    setSaving(true);
    addEntry({
      cocktailId: selectedCocktail.idDrink,
      cocktailName: selectedCocktail.strDrink,
      cocktailThumb: selectedCocktail.strDrinkThumb,
      rating,
      notes,
      photo,
    });
    increment('connoisseur');
    if (rating === 5) increment('critic');
    if (photo) increment('photographer');
    router.back();
  }, [selectedCocktail, rating, notes, photo, addEntry, increment, router]);

  const canSave = selectedCocktail && rating > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>New Entry</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            hitSlop={12}
          >
            <Text
              style={[
                styles.saveButton,
                { color: canSave ? theme.accent : theme.textTertiary },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!selectedCocktail ? (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Search Cocktail
              </Text>
              <View
                style={[
                  styles.searchContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="search" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Type a cocktail name..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                  }}
                  onSubmitEditing={handleSearch}
                  autoFocus
                  returnKeyType="search"
                />
                {searching && (
                  <ActivityIndicator size="small" color={theme.accent} />
                )}
              </View>

              {searchResults.map((cocktail, index) => (
                <Animated.View
                  key={cocktail.idDrink}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <Pressable
                    onPress={() => handleSelectCocktail(cocktail)}
                    style={({ pressed }) => [
                      styles.resultItem,
                      {
                        backgroundColor: pressed
                          ? theme.surfaceSecondary
                          : theme.surface,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: `${cocktail.strDrinkThumb}/preview` }}
                      style={styles.resultThumb}
                    />
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultName, { color: theme.text }]}>
                        {cocktail.strDrink}
                      </Text>
                      <Text style={[styles.resultCategory, { color: theme.textSecondary }]}>
                        {cocktail.strCategory}
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={theme.accent}
                    />
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.springify()}>
                <View
                  style={[styles.selectedCard, { backgroundColor: theme.surface }]}
                >
                  <Image
                    source={{ uri: `${selectedCocktail.strDrinkThumb}/preview` }}
                    style={styles.selectedImage}
                  />
                  <View style={styles.selectedInfo}>
                    <Text style={[styles.selectedName, { color: theme.text }]}>
                      {selectedCocktail.strDrink}
                    </Text>
                    <Text
                      style={[styles.selectedCategory, { color: theme.textSecondary }]}
                    >
                      {selectedCocktail.strCategory}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedCocktail(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.textTertiary} />
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Your Rating
                </Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      hitSlop={4}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#F59E0B' : theme.textTertiary}
                      />
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Tasting Notes
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="How did it taste? What did you enjoy?"
                  placeholderTextColor={theme.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Photo (Optional)
                </Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <Pressable
                      onPress={() => setPhoto(null)}
                      style={[styles.removePhoto, { backgroundColor: theme.error }]}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={handlePickPhoto}
                    style={[
                      styles.photoButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={32} color={theme.textTertiary} />
                    <Text style={[styles.photoButtonText, { color: theme.textSecondary }]}>
                      Add a photo
                    </Text>
                  </Pressable>
                )}
              </Animated.View>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  saveButton: {
    ...typography.button,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
  },
  sectionLabel: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  resultThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...typography.bodyBold,
  },
  resultCategory: {
    ...typography.caption,
    marginTop: 2,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  selectedImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    ...typography.h3,
  },
  selectedCategory: {
    ...typography.caption,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  notesInput: {
    ...typography.body,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 120,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  photoButtonText: {
    ...typography.caption,
  },
});
