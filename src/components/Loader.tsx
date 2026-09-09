import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { theme } from '@/theme/theme';

export interface LoaderProps {
  /** Optional line shown under the spinner. */
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  /** Fills and centers in the available space. */
  fullscreen?: boolean;
}

/** Shared loading state. */
export function Loader({
  label,
  size = 'large',
  color = theme.color.primaryContainer,
  fullscreen = false,
}: LoaderProps) {
  return (
    <View
      style={[styles.container, fullscreen && styles.fullscreen]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      <ActivityIndicator size={size} color={color} />
      {label !== undefined && (
        <Text variant="labelMd" color={theme.color.textMuted} align="center">
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.stackSm,
  },
  fullscreen: {
    flex: 1,
    padding: theme.spacing.stackLg,
  },
});
