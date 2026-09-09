import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'lg' | 'md';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Rendered before the label — typically an icon. */
  leadingIcon?: React.ReactNode;
  /** Rendered after the label — e.g. the `arrow_forward` on "Get started". */
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const SIZE_STYLE: Record<ButtonSize, ViewStyle> = {
  lg: { paddingVertical: 16, paddingHorizontal: 28 },
  md: { paddingVertical: 12, paddingHorizontal: 20 },
};

/**
 *  - primary:   gradient pill, white text, coral lift shadow
 *  - secondary: transparent, 1.5px violet border
 *  - ghost:     no fill, ink text, low-priority actions
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  // A loading button must not fire again, but should still read as enabled.
  const inert = disabled || loading;
  const labelColor = getLabelColor(variant, disabled);

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <>
          {leadingIcon}
          <Text variant="labelMd" color={labelColor} style={styles.label}>
            {label}
          </Text>
          {trailingIcon}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        SIZE_STYLE[size],
        fullWidth && styles.fullWidth,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'primary' && !disabled && theme.shadow.primaryButton,
        disabled && styles.disabled,
        pressed && !inert && { transform: [{ scale: theme.motion.pressScale }] },
        style,
      ]}
    >
      {variant === 'primary' && !disabled && (
        <LinearGradient
          colors={theme.gradient.primary}
          start={theme.gradientDirection.start}
          end={theme.gradientDirection.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      {content}
    </Pressable>
  );
}

function getLabelColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return theme.color.onDisabled;
  switch (variant) {
    case 'primary':
      return theme.color.onPrimary;
    case 'secondary':
      return theme.color.accent;
    case 'ghost':
      return theme.color.ink;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.full,
    minHeight: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    // Clips the gradient layer to the pill.
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: theme.color.accent,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: theme.color.disabled,
    borderColor: withAlpha(theme.color.borderStrong, 0.3),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.stackSm,
  },
  label: {
    // Reference sets the primary label at 16px with wider tracking than labelMd.
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
});
