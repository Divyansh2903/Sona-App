import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Renders a multiline textarea (composer, bio, prompts). */
  multiline?: boolean;
  /** Visible rows when `multiline`. */
  rows?: number;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

/**
 * 10%-opacity fill, 16px radius; focus swaps the border to a 1.5px violet stroke.
 */
export function Input({
  label,
  multiline = false,
  rows = 4,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = error !== undefined && error !== '';

  return (
    <View style={[styles.container, containerStyle]}>
      {label !== undefined && (
        <Text variant="labelMd" color={theme.color.textMuted}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.field,
          multiline && { minHeight: rows * 24 + 24, alignItems: 'flex-start' },
          focused && styles.focused,
          hasError && styles.errored,
        ]}
      >
        {leadingIcon}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholderTextColor={theme.color.textMuted}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {trailingIcon}
      </View>

      {/* Error takes precedence, and is text — never color alone. */}
      {hasError ? (
        <Text variant="labelSm" color={theme.color.error}>
          {error}
        </Text>
      ) : (
        helperText !== undefined && (
          <Text variant="labelSm" color={theme.color.textMuted}>
            {helperText}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.stackSm,
    alignSelf: 'stretch',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.stackSm,
    backgroundColor: withAlpha(theme.color.primary, 0.1),
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.gutter,
    paddingVertical: 12,
    minHeight: theme.layout.minTouchTarget,
    borderWidth: 1.5,
    // Reserved so focus does not shift layout.
    borderColor: 'transparent',
  },
  focused: {
    borderColor: theme.color.accent,
  },
  errored: {
    borderColor: theme.color.error,
  },
  input: {
    flex: 1,
    color: theme.color.text,
    padding: 0,
    ...theme.typography.bodyMd,
  },
  multilineInput: {
    minHeight: 96,
  },
});
