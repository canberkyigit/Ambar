import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

export function useHeaderPadding() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + spacing.sm,
    insets,
  };
}
