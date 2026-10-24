import { StyleSheet, StyleProp, ViewStyle, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { fontFamilies } from '../../theme';
import { haptics } from '../../utils/haptics';
import { PressableScale } from './PressableScale';

type Variant = 'plain' | 'surface' | 'scrim' | 'tinted';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: Variant;
  size?: number;
  color?: string;
  /** Small count shown in a dot on the top-right corner (e.g. unread notifications). */
  badge?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Circular icon button. `scrim` is for buttons placed on top of photos. */
export function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = 40,
  color,
  badge,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const { theme } = useThemeStore();

  const bg: Record<Variant, string> = {
    plain: 'transparent',
    surface: theme.surfaceSecondary,
    scrim: theme.scrim,
    tinted: theme.accentLight,
  };
  const fg = color ?? (variant === 'scrim' ? '#FFFFFF' : variant === 'tinted' ? theme.accent : theme.text);

  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      activeScale={0.9}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg[variant] },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={fg} />
      {!!badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.heart, borderColor: theme.background }]}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: fontFamilies.bold },
});
