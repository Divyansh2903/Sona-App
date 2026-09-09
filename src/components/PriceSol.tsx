import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme } from '@/theme/theme';
import type { TypographyVariant } from '@/theme/tokens';
import { formatSol } from '@/utils/formatSol';

export interface PriceSolProps {
  /** Amount in SOL (not lamports). */
  amountSol: number;
  variant?: TypographyVariant;
  color?: string;
  /** Small line under the amount, e.g. "one-time mint fee". */
  subtitle?: string;
  /** Decimal places; defaults to trimming trailing zeros. */
  decimals?: number;
  style?: ViewStyle;
}

/**
 * Renders a SOL amount as `◎ 0.02`, replacing every `$x.xx` in the UI reference.
 * If you are about to render a currency figure, it goes through here.
 */
export function PriceSol({
  amountSol,
  variant = 'labelMd',
  color = theme.color.primary,
  subtitle,
  decimals,
  style,
}: PriceSolProps) {
  const formatted = formatSol(amountSol, decimals);

  return (
    <View style={[styles.container, style]}>
      <Text
        variant={variant}
        color={color}
        // Screen readers should say "0.02 SOL", not the glyph name.
        accessibilityLabel={`${formatted.replace('◎ ', '')} SOL`}
      >
        {formatted}
      </Text>
      {subtitle !== undefined && (
        <Text variant="labelSm" color={theme.color.textMuted}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 2,
  },
});
