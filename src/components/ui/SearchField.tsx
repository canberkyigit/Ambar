import { ReactNode } from 'react';
import { View, TextInput, Pressable, StyleSheet, StyleProp, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';

interface SearchFieldProps extends Pick<TextInputProps, 'onSubmitEditing' | 'autoFocus' | 'onFocus' | 'onBlur'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Rendered after the clear button (e.g. a filter button). */
  accessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SearchField({ value, onChangeText, placeholder, accessory, style, ...inputProps }: SearchFieldProps) {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.field, { backgroundColor: theme.surfaceSecondary }]}>
        <Ionicons name="search" size={17} color={theme.textTertiary} />
        <TextInput
          {...inputProps}
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
          selectionColor={theme.accent}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={17} color={theme.textTertiary} />
          </Pressable>
        )}
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  input: { flex: 1, ...typography.body, padding: 0 },
});
