import { Redirect } from 'expo-router';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';

export default function IndexRedirect() {
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  // Redirect runs when the router is ready; avoids "navigate before mount" error.
  if (hasSeenOnboarding) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/onboarding" />;
}
