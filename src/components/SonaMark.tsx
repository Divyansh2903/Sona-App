import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

export type SonaMarkSize = 'sm' | 'md' | 'lg';

export interface SonaMarkProps {
  size?: SonaMarkSize;
  /** Hides the mark when the profile has no minted Sona. */
  owned?: boolean;
}

interface MarkMetrics {
  ring: number;
  dot: number;
  border: number;
  glow: number;
}

const METRICS: Record<SonaMarkSize, MarkMetrics> = {
  sm: { ring: 14, dot: 6, border: 1.5, glow: 6 },
  md: { ring: 20, dot: 8, border: 2, glow: 10 },
  lg: { ring: 64, dot: 16, border: 2, glow: 15 },
};

/**
 * The Sona Mark (SONA_TECHNICAL_PLAN.md §5.2, DESIGN.md "The Sona Mark").
 *
 * A concentric ring with a solid dot in #16B981, wrapped in a 10% green glow.
 * It represents a "pulse"/"soul".
 *
 * MEANING (§0 identity positioning, decision log #1): this mark means **"a minted,
 * owned Sona"** — a claim verifiable on-chain — and NOT "verified human". The Genesis
 * Token check was removed from scope, so the app performs no humanity verification.
 * Never label this "verified human" in UI copy or accessibility strings.
 *
 * It is deliberately NOT a checkmark, and #16B981 is reserved for this component
 * alone — do not reuse the color decoratively.
 */
export function SonaMark({ size = 'md', owned = true }: SonaMarkProps) {
  if (!owned) return null;

  const { ring, dot, border, glow } = METRICS[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Minted Sona, owned on-chain"
      style={[
        styles.ring,
        {
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: border,
          shadowRadius: glow,
        },
      ]}
    >
      <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.color.verified,
    // The 10% glow that always accompanies the mark.
    shadowColor: theme.color.verified,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  dot: {
    backgroundColor: theme.color.verified,
  },
});
