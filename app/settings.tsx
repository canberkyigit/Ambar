import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, type ThemePreference } from '../src/stores/useThemeStore';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { NavHeader } from '../src/components/ui';
import { haptics } from '../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER } from '../src/theme';

const ICON_WELL = 30;

function Group({ label, children }: { label: string; children: ReactNode }) {
  const { theme } = useThemeStore();
  return (
    <View style={styles.group}>
      <Text style={[typography.overline, styles.groupLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Secondary text shown on the right side of the row. */
  value?: string;
  /** Custom trailing element (e.g. a Switch). Defaults to a chevron when `onPress` is set. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Draws a hairline above the row (every row except the first in a group). */
  divider?: boolean;
}

function Row({ icon, label, value, trailing, onPress, divider }: RowProps) {
  const { theme } = useThemeStore();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceSecondary }]}
    >
      <View style={[styles.iconWell, { backgroundColor: theme.accentLight }]}>
        <Ionicons name={icon} size={17} color={theme.accent} />
      </View>
      <View style={[styles.rowBody, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]} numberOfLines={1}>
          {label}
        </Text>
        {value != null && <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>}
        {trailing ?? (onPress && <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />)}
      </View>
    </Pressable>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, scheme, preference, setPreference } = useThemeStore();
  const { setHasSeenOnboarding } = useOnboardingStore();

  const showOnboardingAgain = () => {
    setHasSeenOnboarding(false);
    router.replace('/onboarding');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavHeader title="Settings" />
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <Group label="Appearance">
          <Row
            icon={scheme === 'dark' ? 'moon' : 'sunny'}
            label="Theme"
            trailing={
              <View style={[styles.segmented, { backgroundColor: theme.surfaceSecondary }]} accessibilityRole="radiogroup">
                {THEME_OPTIONS.map((o) => {
                  const active = preference === o.value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => {
                        haptics.selection();
                        setPreference(o.value);
                      }}
                      style={[styles.segment, active && { backgroundColor: theme.elevated }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[typography.captionBold, { color: active ? theme.text : theme.textSecondary }]}>
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />
        </Group>

        <Group label="Account">
          <Row icon="person" label="Edit profile" onPress={() => router.push('/edit-profile')} />
        </Group>

        <Group label="About">
          <Row icon="sparkles" label="Show onboarding again" onPress={showOnboardingAgain} />
          <Row icon="information-circle" label="Version" value="1.0.0" divider />
        </Group>

        <Text style={[styles.footer, { color: theme.textTertiary }]}>Powered by TheCocktailDB</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  group: { marginTop: spacing.xl, paddingHorizontal: GUTTER },
  groupLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    gap: spacing.md,
  },
  iconWell: {
    width: ICON_WELL,
    height: ICON_WELL,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  rowLabel: { ...typography.body, flex: 1 },
  segmented: { flexDirection: 'row', borderRadius: borderRadius.sm + 1, padding: 2 },
  segment: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.sm - 1 },
  rowValue: { ...typography.body },
  footer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
