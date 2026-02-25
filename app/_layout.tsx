import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import AchievementUnlock from '../src/components/shared/AchievementUnlock';
import { Toast } from '../src/components/shared/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { scheme, theme } = useThemeStore();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

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
          animation: 'slide_from_right',
        }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="cocktail/[id]"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="category/[name]" />
        <Stack.Screen name="ingredient-search" />
        <Stack.Screen name="create-recipe" />
        <Stack.Screen name="my-recipes" />
        <Stack.Screen name="cocktail/prepare" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="my-bar" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="journal/add" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="collections" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="unit-converter" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-post" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="pick-cocktail" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
      <AchievementUnlock />
      <Toast />
    </GestureHandlerRootView>
  );
}
