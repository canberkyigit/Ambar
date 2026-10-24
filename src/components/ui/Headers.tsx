import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, GUTTER } from '../../theme';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned actions, usually IconButtons. */
  right?: ReactNode;
  /** Pass false when the header is rendered inside a list that already handles the top inset. */
  withInset?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Large-title header used at the top of every tab. */
export function ScreenHeader({ title, subtitle, right, withInset = true, style }: ScreenHeaderProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screenHeader, withInset && { paddingTop: insets.top + spacing.sm }, style]}>
      <View style={styles.titleBlock}>
        <Text style={[typography.largeTitle, { color: theme.text }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.actions}>{right}</View>}
    </View>
  );
}

interface NavHeaderProps {
  title?: string;
  right?: ReactNode;
  /** Use a close (×) icon instead of a back chevron — for modally presented screens. */
  modal?: boolean;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Compact header for pushed screens: back button, centered title, optional right slot. */
export function NavHeader({ title, right, modal = false, onBack, style }: NavHeaderProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.navHeader, { paddingTop: insets.top + spacing.xs }, style]}>
      <View style={styles.navSide}>
        <IconButton
          icon={modal ? 'close' : 'chevron-back'}
          onPress={onBack ?? (() => router.back())}
          accessibilityLabel={modal ? 'Close' : 'Back'}
          size={38}
        />
      </View>
      <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.navSide, styles.navRight]}>{right}</View>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.section, style]}>
      <Text style={[typography.h2, { color: theme.text }]} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[typography.captionBold, { color: theme.accent }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  titleBlock: { flex: 1 },
  subtitle: { ...typography.caption, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingBottom: spacing.sm,
  },
  navSide: { width: 88, flexDirection: 'row', alignItems: 'center' },
  navRight: { justifyContent: 'flex-end', gap: spacing.sm },
  navTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    marginBottom: spacing.md,
  },
});
