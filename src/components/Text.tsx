import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { theme } from '@/theme/theme';
import type { TypographyVariant } from '@/theme/tokens';

export interface TextProps extends RNTextProps {
  /** Typography scale from DESIGN.md. Defaults to `bodyMd`. */
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Renders the label in uppercase with the wider tracking the reference uses. */
  uppercase?: boolean;
}

/**
 * Typography primitive. Every piece of text in Sona should go through this so the
 * DESIGN.md scale stays the single source of truth.
 *
 * Font scaling is left enabled (plan §3, accessibility) — do not set
 * `allowFontScaling={false}` without a documented reason.
 */
export function Text({
  variant = 'bodyMd',
  color = theme.color.text,
  align,
  uppercase = false,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color },
        align !== undefined && { textAlign: align },
        uppercase && { textTransform: 'uppercase', letterSpacing: 1 },
        style,
      ]}
      {...rest}
    />
  );
}
