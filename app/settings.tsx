import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { useMyBarStore } from '../src/stores/useMyBarStore';
import { useJournalStore } from '../src/stores/useJournalStore';
import { useAchievementStore, ACHIEVEMENTS } from '../src/stores/useAchievementStore';
import { useCollectionsStore } from '../src/stores/useCollectionsStore';
import { typography, spacing, borderRadius } from '../src/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
  index: number;
}

function MenuItem({ icon, label, subtitle, color, onPress, index }: MenuItemProps) {
  const { theme } = useThemeStore();
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuRow,
          { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: theme.text }]}>{label}</Text>
          {subtitle && (
            <Text style={[styles.menuSub, { color: theme.textTertiary }]}>{subtitle}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, scheme, toggleTheme } = useThemeStore();
  const { ingredients: barIngredients } = useMyBarStore();
  const { entries } = useJournalStore();
  const { progress } = useAchievementStore();
  const { collections } = useCollectionsStore();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const unlockedCount = progress.filter((p) => p.unlockedAt != null).length;

  const showOnboardingAgain = () => {
    setHasSeenOnboarding(false);
    router.replace('/onboarding');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 60, paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </Animated.View>

      {/* Appearance */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>APPEARANCE</Text>
      </View>
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <View style={[styles.menuRow, { backgroundColor: theme.surface }]}>
          <View style={[styles.menuIconWrap, { backgroundColor: theme.accent + '18' }]}>
            <Ionicons name={scheme === 'dark' ? 'moon' : 'sunny'} size={18} color={theme.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Animated.View>

      {/* Features */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>FEATURES</Text>
      </View>
      <MenuItem icon="wine" label="My Bar" subtitle={`${barIngredients.length} ingredients`} color="#10B981" onPress={() => router.push('/my-bar')} index={0} />
      <MenuItem icon="journal" label="Journal" subtitle={`${entries.length} entries`} color="#3B82F6" onPress={() => router.push('/journal')} index={1} />
      <MenuItem icon="folder" label="Collections" subtitle={`${collections.length} collections`} color="#8B5CF6" onPress={() => router.push('/collections')} index={2} />
      <MenuItem icon="trophy" label="Achievements" subtitle={`${unlockedCount}/${ACHIEVEMENTS.length} unlocked`} color="#F59E0B" onPress={() => router.push('/achievements')} index={3} />
      <MenuItem icon="calculator" label="Unit Converter" color="#6366F1" onPress={() => router.push('/unit-converter')} index={4} />

      {/* About */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ABOUT</Text>
      </View>
      <MenuItem icon="rocket" label="Show onboarding again" subtitle="Replay the welcome flow" color="#14B8A6" onPress={showOnboardingAgain} index={10} />
      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <View style={[styles.menuRow, { backgroundColor: theme.surface }]}>
          <View style={[styles.menuIconWrap, { backgroundColor: '#6366F118' }]}>
            <Ionicons name="information-circle" size={18} color="#6366F1" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Version</Text>
            <Text style={[styles.menuSub, { color: theme.textTertiary }]}>1.0.0</Text>
          </View>
        </View>
      </Animated.View>

      <Text style={[styles.footer, { color: theme.textTertiary }]}>
        Powered by TheCocktailDB
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2 },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.small,
    fontWeight: '600',
    letterSpacing: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuTitle: { ...typography.bodyBold },
  menuSub: { ...typography.small, marginTop: 1 },
  footer: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
