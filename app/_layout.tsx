import { useEffect } from 'react';
import { View, ActivityIndicator, Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useFavoritesStore } from '../src/stores/useFavoritesStore';
import { useCustomRecipeStore } from '../src/stores/useCustomRecipeStore';
import { syncAchievementsOnLaunch } from '../src/stores/achievementSync';
import AchievementUnlock from '../src/components/shared/AchievementUnlock';
import { Toast } from '../src/components/shared/Toast';

SplashScreen.preventAutoHideAsync();

/** Bottom-presented screens; iOS defaults this animation to a sluggish 500ms. */
const MODAL_SLIDE = { animation: 'slide_from_bottom', animationDuration: 280 } as const;

export default function RootLayout() {
  const { scheme, theme, syncWithSystem } = useThemeStore();

  useEffect(() => {
    const sub = Appearance.addChangeListener(syncWithSystem);
    return () => sub.remove();
  }, [syncWithSystem]);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(
    () =>
      syncAchievementsOnLaunch(
        () => ({
          favorites: useFavoritesStore.getState().favorites.length,
          recipes: useCustomRecipeStore.getState().recipes.length,
        }),
        [useFavoritesStore, useCustomRecipeStore],
      ),
    [],
  );

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          // Native iOS push (interruptible) + swipe back from anywhere on the screen.
          animation: 'default',
          fullScreenGestureEnabled: true,
        }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cocktail/[id]" />
        <Stack.Screen name="category/[name]" />
        <Stack.Screen name="ingredient-search" />
        <Stack.Screen name="create-recipe" />
        <Stack.Screen name="my-recipes" />
        <Stack.Screen name="cocktail/prepare" options={{ ...MODAL_SLIDE, gestureEnabled: false }} />
        <Stack.Screen name="my-bar" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="journal/add" options={MODAL_SLIDE} />
        <Stack.Screen name="collections" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="unit-converter" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="post/[id]" options={MODAL_SLIDE} />
        <Stack.Screen name="create-post" options={MODAL_SLIDE} />
        <Stack.Screen name="pick-cocktail" options={MODAL_SLIDE} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="edit-profile" options={MODAL_SLIDE} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', animationDuration: 250, gestureEnabled: false }} />
      </Stack>
      <AchievementUnlock />
      <Toast />
    </GestureHandlerRootView>
  );
}
