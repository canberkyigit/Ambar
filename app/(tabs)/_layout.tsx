import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar } from '../../src/components/navigation/FloatingTabBar';
import { useThemeStore } from '../../src/stores/useThemeStore';

const TABS: { name: string; title: string }[] = [
  { name: 'index', title: 'Feed' },
  { name: 'search', title: 'Cocktails' },
  { name: 'discover', title: 'Discover' },
  { name: 'favorites', title: 'Bars' },
  { name: 'profile', title: 'Profile' },
];

export default function TabLayout() {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </Tabs>
      {/* Keeps scrolled content from running under the status bar. */}
      <LinearGradient
        pointerEvents="none"
        colors={[theme.background, theme.background, theme.background + '00']}
        locations={[0, 0.75, 1]}
        style={[styles.statusScrim, { height: insets.top + 6 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
