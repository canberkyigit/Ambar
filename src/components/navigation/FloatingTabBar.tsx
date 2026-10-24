import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeStore } from '../../stores/useThemeStore';
import { fontFamilies, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { icon: IconName; iconActive: IconName }> = {
  index: { icon: 'home-outline', iconActive: 'home' },
  search: { icon: 'wine-outline', iconActive: 'wine' },
  discover: { icon: 'compass-outline', iconActive: 'compass' },
  favorites: { icon: 'map-outline', iconActive: 'map' },
  profile: { icon: 'person-circle-outline', iconActive: 'person-circle' },
};

const BAR_HEIGHT = 64;
const INSET = 6;
const SIDE_MARGIN = 20;
const SPRING = { damping: 22, stiffness: 260, mass: 0.7 };

function floatingBottom(safeBottom: number) {
  // Sit just above the home indicator; keep a small gap on devices without one.
  return safeBottom > 0 ? safeBottom - 20 : spacing.md;
}

/** Floating, rounded tab bar with a sliding highlight behind the active tab. */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { scheme, theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tabWidth = width > 0 ? (width - INSET * 2) / state.routes.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(state.index * tabWidth, SPRING);
  }, [state.index, tabWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={[styles.wrap, { bottom: floatingBottom(insets.bottom) }]}
      pointerEvents="box-none"
    >
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            borderColor: theme.tabBarBorder,
            shadowColor: scheme === 'dark' ? '#000' : '#5A4220',
            shadowOpacity: scheme === 'dark' ? 0.5 : 0.14,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.clip]}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {/* Tint over the blur so labels stay legible on top of bright photos. */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor:
                  Platform.OS !== 'ios'
                    ? theme.tabBar
                    : scheme === 'dark'
                      ? 'rgba(20, 18, 16, 0.78)'
                      : 'rgba(255, 255, 255, 0.78)',
              },
            ]}
          />
        </View>

        {tabWidth > 0 && (
          <Animated.View
            style={[styles.indicator, { width: tabWidth, backgroundColor: theme.accentLight }, indicatorStyle]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? theme.accent : theme.textSecondary;
          const icons = TAB_ICONS[route.name];
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptics.selection();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {icons && <Ionicons name={focused ? icons.iconActive : icons.icon} size={22} color={color} />}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: SIDE_MARGIN, right: SIDE_MARGIN },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: INSET,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 12,
  },
  clip: { borderRadius: BAR_HEIGHT / 2, overflow: 'hidden' },
  indicator: {
    position: 'absolute',
    left: INSET,
    top: INSET,
    bottom: INSET,
    borderRadius: (BAR_HEIGHT - INSET * 2) / 2,
  },
  tab: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10.5, fontFamily: fontFamilies.semiBold, letterSpacing: 0.1 },
});
