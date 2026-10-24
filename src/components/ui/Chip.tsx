import { Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius } from '../../theme';
import { haptics } from '../../utils/haptics';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon color when not selected (e.g. mood colors). Defaults to secondary text. */
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Filter / choice chip. Selected state uses the inverted text color for strong contrast. */
export function Chip({ label, onPress, onLongPress, selected = false, icon, iconColor, style }: ChipProps) {
  const { theme } = useThemeStore();
  const fg = selected ? theme.background : theme.text;

  return (
    <PressableScale
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      onLongPress={onLongPress}
      activeScale={0.95}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.text : theme.surface,
          borderColor: selected ? theme.text : theme.border,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={15} color={selected ? fg : iconColor ?? theme.textSecondary} />}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.captionBold },
});
