import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCustomRecipeStore } from '../src/stores/useCustomRecipeStore';
import { Button, Chip, IconButton, NavHeader, PressableScale } from '../src/components/ui';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';
import type { Ingredient } from '../src/types/cocktail';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { addRecipe } = useCustomRecipeStore();

  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [glass, setGlass] = useState('');
  const [alcoholic, setAlcoholic] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', measure: '' },
  ]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: '', measure: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a cocktail name.');
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert('Missing info', 'Please add at least one ingredient.');
      return;
    }

    addRecipe({
      name: name.trim(),
      image,
      category: category.trim() || 'Custom',
      alcoholic,
      glass: glass.trim() || 'Cocktail Glass',
      instructions: instructions.trim(),
      ingredients: validIngredients,
    });

    router.back();
  };

  const inputStyle = [styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }];
  const labelStyle = [styles.label, { color: theme.textSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="New recipe" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Photo */}
          <PressableScale
            onPress={pickImage}
            style={[styles.imagePicker, { backgroundColor: theme.surfaceSecondary }]}
            accessibilityRole="button"
            accessibilityLabel={image ? 'Change photo' : 'Add photo'}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
                <Text style={[typography.captionBold, { color: theme.textSecondary }]}>Add photo</Text>
              </View>
            )}
          </PressableScale>

          {/* Name */}
          <View style={styles.field}>
            <Text style={labelStyle}>Name</Text>
            <TextInput
              style={inputStyle}
              placeholder="Cocktail name"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          {/* Category & glass */}
          <View style={[styles.field, styles.row]}>
            <View style={styles.flex}>
              <Text style={labelStyle}>Category</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Tropical"
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.accent}
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View style={styles.flex}>
              <Text style={labelStyle}>Glass</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Highball"
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.accent}
                value={glass}
                onChangeText={setGlass}
              />
            </View>
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={labelStyle}>Type</Text>
            <View style={styles.chips}>
              <Chip label="Alcoholic" selected={alcoholic} onPress={() => setAlcoholic(true)} />
              <Chip label="Non-alcoholic" selected={!alcoholic} onPress={() => setAlcoholic(false)} />
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.field}>
            <Text style={labelStyle}>Ingredients</Text>
            <View style={styles.ingredients}>
              {ingredients.map((item, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <TextInput
                    style={[inputStyle, styles.ingredientInput]}
                    placeholder="Ingredient"
                    placeholderTextColor={theme.textTertiary}
                    selectionColor={theme.accent}
                    value={item.name}
                    onChangeText={(v) => updateIngredient(index, 'name', v)}
                  />
                  <TextInput
                    style={[inputStyle, styles.measureInput]}
                    placeholder="Amount"
                    placeholderTextColor={theme.textTertiary}
                    selectionColor={theme.accent}
                    value={item.measure}
                    onChangeText={(v) => updateIngredient(index, 'measure', v)}
                  />
                  <IconButton
                    icon="remove-circle-outline"
                    variant="plain"
                    color={ingredients.length > 1 ? theme.textSecondary : theme.textTertiary}
                    onPress={() => removeIngredient(index)}
                    accessibilityLabel={`Remove ingredient ${index + 1}`}
                  />
                </View>
              ))}
            </View>
            <Button
              title="Add ingredient"
              icon="add"
              variant="ghost"
              size="sm"
              onPress={addIngredientRow}
              style={styles.addIngredient}
            />
          </View>

          {/* Instructions */}
          <View style={styles.field}>
            <Text style={labelStyle}>Instructions</Text>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="How to prepare this cocktail…"
              placeholderTextColor={theme.textTertiary}
              selectionColor={theme.accent}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

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
          <Button title="Save recipe" size="lg" fullWidth onPress={handleSave} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: spacing['2xl'] },
  imagePicker: {
    height: 168,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  field: { marginTop: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { ...typography.captionBold, marginBottom: spacing.sm },
  input: {
    ...typography.body,
    height: 46,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.md,
  },
  chips: { flexDirection: 'row', gap: spacing.sm },
  ingredients: { gap: spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ingredientInput: { flex: 2 },
  measureInput: { flex: 1 },
  addIngredient: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: 0 },
  textArea: { height: undefined, minHeight: 120, paddingTop: spacing.md, paddingBottom: spacing.md },
  bottomBar: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
