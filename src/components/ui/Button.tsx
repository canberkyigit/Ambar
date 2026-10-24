import { Text, StyleSheet, ActivityIndicator, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';
import { haptics } from '../../utils/haptics';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'tinted' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 46, lg: 54 };
const ICON: Record<Size, number> = { sm: 16, md: 18, lg: 20 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useThemeStore();

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.accent, fg: theme.onAccent },
    secondary: { bg: theme.surface, fg: theme.text, border: theme.border },
    tinted: { bg: theme.accentLight, fg: theme.accent },
    ghost: { bg: 'transparent', fg: theme.accent },
    destructive: { bg: theme.error + '18', fg: theme.error },
  };
  const { bg, fg, border } = palette[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          borderRadius: size === 'lg' ? borderRadius.lg : borderRadius.md,
          backgroundColor: bg,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          borderColor: border,
          opacity: disabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={ICON[size]} color={fg} />}
          <Text
            style={[size === 'sm' ? typography.captionBold : typography.button, { color: fg }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
