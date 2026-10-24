import { ReactNode } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography, spacing, borderRadius, GUTTER } from '../../theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Right side of the title row (e.g. a "Reset" link). */
  headerRight?: ReactNode;
  children: ReactNode;
}

/** Bottom sheet built on Modal: dimmed backdrop, grab handle, safe-area and keyboard aware. */
export function Sheet({ visible, onClose, title, headerRight, children }: SheetProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.elevated, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {(title || headerRight) && (
            <View style={styles.header}>
              <Text style={[typography.h2, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                {title}
              </Text>
              {headerRight}
            </View>
          )}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: GUTTER,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
});
