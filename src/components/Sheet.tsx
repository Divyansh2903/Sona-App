import { Modal, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface SheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Blocks backdrop/back-button dismissal. Use for in-flight transactions so a
   * stray tap can't orphan a mint the user already paid for.
   */
  dismissable?: boolean;
  style?: ViewStyle;
}

/**
 * Bottom sheet for confirm / mint / tip / report actions.
 */
export function Sheet({
  visible,
  onDismiss,
  title,
  subtitle,
  children,
  dismissable = true,
  style,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const handleDismiss = () => {
    if (dismissable) onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          // Not an interactive target when locked — don't advertise it.
          accessibilityElementsHidden={!dismissable}
          importantForAccessibility={dismissable ? 'yes' : 'no-hide-descendants'}
        />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.stackLg }, style]}
        >
          <View style={styles.handle} />

          {title !== undefined && (
            <Text variant="headlineMd" color={theme.color.primary} align="center">
              {title}
            </Text>
          )}
          {subtitle !== undefined && (
            <Text variant="bodyMd" color={theme.color.textMuted} align="center">
              {subtitle}
            </Text>
          )}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(theme.color.primary, 0.35),
  },
  sheet: {
    backgroundColor: theme.color.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingHorizontal: theme.layout.cardPadding,
    paddingTop: theme.spacing.gutter,
    gap: theme.spacing.stackSm,
    maxHeight: '85%',
    width: '100%',
    maxWidth: theme.layout.socialTrackMaxWidth,
    alignSelf: 'center',
    ...theme.shadow.sheet,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.gutter,
  },
  body: {
    marginTop: theme.spacing.stackSm,
  },
  bodyContent: {
    gap: theme.spacing.stackMd,
    paddingBottom: theme.spacing.stackSm,
  },
});
