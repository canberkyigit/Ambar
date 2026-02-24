import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useCustomRecipeStore } from '../src/stores/useCustomRecipeStore';
import { typography, spacing, borderRadius } from '../src/theme';
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
      Alert.alert('Missing Info', 'Please enter a cocktail name.');
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert('Missing Info', 'Please add at least one ingredient.');
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Recipe</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={[styles.saveText, { color: theme.accent }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Image Picker */}
          <Animated.View entering={FadeInDown.springify()}>
            <Pressable onPress={pickImage} style={[styles.imagePicker, { backgroundColor: theme.surface }]}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={40} color={theme.textTertiary} />
                  <Text style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}>
                    Add Photo
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* Name */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Cocktail name"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </Animated.View>

          {/* Category & Glass */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Tropical"
                placeholderTextColor={theme.textTertiary}
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Glass</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Highball"
                placeholderTextColor={theme.textTertiary}
                value={glass}
                onChangeText={setGlass}
              />
            </View>
          </Animated.View>

          {/* Alcoholic Toggle */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.toggleRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
            <View style={styles.toggleButtons}>
              <Pressable
                onPress={() => setAlcoholic(true)}
                style={[
                  styles.toggleBtn,
                  { backgroundColor: alcoholic ? theme.accent : theme.surface },
                ]}
              >
                <Text style={{ color: alcoholic ? '#FFFFFF' : theme.textSecondary, ...typography.captionBold }}>
                  Alcoholic
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAlcoholic(false)}
                style={[
                  styles.toggleBtn,
                  { backgroundColor: !alcoholic ? theme.accent : theme.surface },
                ]}
              >
                <Text style={{ color: !alcoholic ? '#FFFFFF' : theme.textSecondary, ...typography.captionBold }}>
                  Non-Alcoholic
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Ingredients */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Ingredients</Text>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Ingredient"
                  placeholderTextColor={theme.textTertiary}
                  value={item.name}
                  onChangeText={(v) => updateIngredient(index, 'name', v)}
                />
                <TextInput
                  style={[styles.input, styles.measureInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Amount"
                  placeholderTextColor={theme.textTertiary}
                  value={item.measure}
                  onChangeText={(v) => updateIngredient(index, 'measure', v)}
                />
                <Pressable onPress={() => removeIngredient(index)} hitSlop={8}>
                  <Ionicons
                    name="remove-circle"
                    size={24}
                    color={ingredients.length > 1 ? theme.error : theme.textTertiary}
                  />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={addIngredientRow}
              style={[styles.addButton, { borderColor: theme.accent }]}
            >
              <Ionicons name="add" size={20} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Ingredient
              </Text>
            </Pressable>
          </Animated.View>

          {/* Instructions */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="How to prepare this cocktail..."
              placeholderTextColor={theme.textTertiary}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </Animated.View>
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
  headerTitle: {
    ...typography.h3,
  },
  saveText: {
    ...typography.button,
  },
  imagePicker: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    ...typography.body,
  },
  field: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  label: {
    ...typography.captionBold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...typography.body,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  toggleRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ingredientInput: {
    flex: 2,
  },
  measureInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  addButtonText: {
    ...typography.bodyBold,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
});
