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
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useJournalStore } from '../../src/stores/useJournalStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { cocktailService } from '../../src/services/cocktailService';
import { Button, IconButton, NavHeader, PressableScale, SearchField } from '../../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../../src/theme';
import { haptics } from '../../src/utils/haptics';
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
  }, [handleSearch]);

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
      Alert.alert('Select a cocktail', 'Please search and select a cocktail first.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Add a rating', 'Please tap a star to rate this cocktail.');
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
  const labelStyle = [styles.label, { color: theme.textSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="New entry" modal />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {!selectedCocktail ? (
            <>
              <Text style={labelStyle}>Cocktail</Text>
              <SearchField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for a cocktail"
                onSubmitEditing={handleSearch}
                autoFocus
              />

              {searching && searchResults.length === 0 ? (
                <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
              ) : searchResults.length > 0 ? (
                <View style={[styles.card, styles.results, { backgroundColor: theme.surface }]}>
                  {searchResults.map((cocktail, index) => (
                    <Pressable
                      key={cocktail.idDrink}
                      onPress={() => handleSelectCocktail(cocktail)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.resultItem,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                        pressed && { backgroundColor: theme.surfaceSecondary },
                      ]}
                    >
                      <Image
                        source={{ uri: `${cocktail.strDrinkThumb}/preview` }}
                        style={[styles.resultThumb, { backgroundColor: theme.surfaceSecondary }]}
                      />
                      <View style={styles.flex}>
                        <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
                          {cocktail.strDrink}
                        </Text>
                        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                          {cocktail.strCategory}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={labelStyle}>Cocktail</Text>
              <View style={[styles.card, styles.selectedCard, { backgroundColor: theme.surface }]}>
                <Image
                  source={{ uri: `${selectedCocktail.strDrinkThumb}/preview` }}
                  style={[styles.selectedImage, { backgroundColor: theme.surfaceSecondary }]}
                />
                <View style={styles.flex}>
                  <Text style={[typography.h3, { color: theme.text }]} numberOfLines={1}>
                    {selectedCocktail.strDrink}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                    {selectedCocktail.strCategory}
                  </Text>
                </View>
                <Button title="Change" variant="ghost" size="sm" onPress={() => setSelectedCocktail(null)} />
              </View>

              <View style={styles.field}>
                <Text style={labelStyle}>Your rating</Text>
                <View style={[styles.card, styles.ratingRow, { backgroundColor: theme.surface }]}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => {
                        haptics.selection();
                        setRating(star);
                      }}
                      hitSlop={4}
                      style={styles.starButton}
                      accessibilityRole="button"
                      accessibilityLabel={`${star} ${star === 1 ? 'star' : 'stars'}`}
                      accessibilityState={{ selected: star <= rating }}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={34}
                        color={star <= rating ? theme.star : theme.textTertiary}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={labelStyle}>Tasting notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
                  placeholder="How did it taste? What did you enjoy?"
                  placeholderTextColor={theme.textTertiary}
                  selectionColor={theme.accent}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.field}>
                <Text style={labelStyle}>Photo (optional)</Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <IconButton
                      icon="close"
                      variant="scrim"
                      size={30}
                      onPress={() => setPhoto(null)}
                      accessibilityLabel="Remove photo"
                      style={styles.removePhoto}
                    />
                  </View>
                ) : (
                  <PressableScale
                    onPress={handlePickPhoto}
                    accessibilityRole="button"
                    style={[styles.photoButton, { backgroundColor: theme.surfaceSecondary }]}
                  >
                    <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
                    <Text style={[typography.captionBold, { color: theme.textSecondary }]}>Add photo</Text>
                  </PressableScale>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {selectedCocktail && (
          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom: Math.max(insets.bottom, spacing.lg),
                backgroundColor: theme.background,
                borderTopColor: theme.separator,
              },
            ]}
          >
            <Button
              title={rating > 0 ? 'Save entry' : 'Rate to save'}
              size="lg"
              fullWidth
              onPress={handleSave}
              disabled={!canSave || saving}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: spacing['2xl'] },
  field: { marginTop: spacing.xl },
  label: { ...typography.captionBold, marginBottom: spacing.sm },
  card: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  loading: { marginTop: spacing['2xl'] },
  results: { marginTop: spacing.md },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  resultThumb: { width: 44, height: 44, borderRadius: borderRadius.sm },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  selectedImage: { width: 56, height: 56, borderRadius: borderRadius.md },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  starButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.md,
  },
  textArea: { minHeight: 120, paddingTop: spacing.md, paddingBottom: spacing.md },
  photoContainer: { alignSelf: 'flex-start' },
  photoPreview: { width: 120, height: 120, borderRadius: borderRadius.lg },
  removePhoto: { position: 'absolute', top: spacing.xs + 2, right: spacing.xs + 2 },
  photoButton: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
