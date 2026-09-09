import {
  brand,
  glass,
  palette,
  radius,
  shadow,
  spacing,
  typography,
  CARD_PADDING,
  FLOATING_NAV_OFFSET,
  MIN_TOUCH_TARGET,
  PRESS_SCALE,
  SOCIAL_TRACK_MAX_WIDTH,
  space,
} from '@/theme/tokens';

/**
 * Components consume `theme.color.*` rather than raw palette entries, so a token
 * change lands everywhere at once. Light-first only — Sona has no dark mode.
 */
export const theme = {
  color: {
    // Surfaces
    background: palette.background,
    surface: palette.surface,
    card: palette.surfaceContainerLowest,
    surfaceMuted: palette.surfaceContainer,
    surfaceRaised: palette.surfaceContainerLow,

    // Text
    text: palette.onSurface,
    textMuted: palette.onSurfaceVariant,
    textInverse: palette.inverseOnSurface,
    ink: brand.ink,

    // Brand
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    primaryContainer: palette.primaryContainer,
    secondary: palette.secondary,
    secondaryContainer: palette.secondaryContainer,
    onSecondary: palette.onSecondary,
    /** Accent/border violet — distinct from the `secondary` fill. */
    accent: brand.secondaryViolet,

    // Lines
    border: palette.outlineVariant,
    borderStrong: palette.outline,

    // Status
    verified: brand.verifiedGreen,
    verifiedGlow: brand.verifiedGlow,
    error: palette.error,
    onError: palette.onError,
    errorContainer: palette.errorContainer,
    onErrorContainer: palette.onErrorContainer,

    disabled: palette.surfaceContainerHighest,
    onDisabled: palette.outline,
  },

  gradient: {
    /** 135° plum → coral. Pair with `gradientDirection` on LinearGradient. */
    primary: brand.primaryGradient,
  },

  /** 135° in CSS == top-left → bottom-right for expo-linear-gradient. */
  gradientDirection: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  glass,
  radius,
  spacing,
  typography,
  shadow,
  space,

  layout: {
    cardPadding: CARD_PADDING,
    socialTrackMaxWidth: SOCIAL_TRACK_MAX_WIDTH,
    minTouchTarget: MIN_TOUCH_TARGET,
    floatingNavOffset: FLOATING_NAV_OFFSET,
  },

  motion: {
    pressScale: PRESS_SCALE,
  },
} as const;

export type Theme = typeof theme;

/**
 * Applies an alpha channel to a 6-digit hex color.
 * Used for the 10%-opacity fills the reference relies on (inputs, icon chips).
 */
export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) {
    throw new Error(`withAlpha expects a 6-digit hex color, received "${hexColor}"`);
  }
  const clamped = Math.max(0, Math.min(1, alpha));
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

/**
 * Nested radii should be slightly smaller than their parent so corners stay
 * concentric (DESIGN.md "Shapes": Outer − Padding = Inner).
 */
export function innerRadius(outerRadius: number, padding: number): number {
  return Math.max(0, outerRadius - padding);
}
