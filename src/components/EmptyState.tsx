import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Icon or illustration shown above the title. */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Switches copy styling to the error tone; the title still carries the meaning. */
  tone?: 'empty' | 'error';
  style?: ViewStyle;
}

/**
 * Shared empty AND error state, so every screen can cover both.
 */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  tone = 'empty',
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} accessibilityRole="summary">
      {icon !== undefined && (
        <View style={[styles.iconWell, tone === 'error' && styles.iconWellError]}>{icon}</View>
      )}

      <Text variant="headlineMd" color={theme.color.primary} align="center">
        {title}
      </Text>

      {description !== undefined && (
        <Text variant="bodyMd" color={theme.color.textMuted} align="center">
          {description}
        </Text>
      )}

      {actionLabel !== undefined && onAction !== undefined && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={tone === 'error' ? 'primary' : 'secondary'}
          size="md"
          fullWidth={false}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.stackSm,
    padding: theme.spacing.stackLg,
  },
  iconWell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.color.primary, 0.06),
    marginBottom: theme.spacing.stackSm,
  },
  iconWellError: {
    backgroundColor: theme.color.errorContainer,
  },
  action: {
    marginTop: theme.spacing.stackMd,
  },
});
