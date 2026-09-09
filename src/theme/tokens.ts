/**
 * Ported from the `sona_app_ui/sona/DESIGN.md` YAML frontmatter, which is the
 * source of truth for every value here.
 *
 * Background is deliberately the warm #fff7f9 from that YAML, even though the
 * DESIGN.md prose, every `code.html`, and the rendered screenshots all show a
 * cooler #F3F0F7. The frontmatter wins. Do not hardcode #F3F0F7 anywhere.
 */

/** Verbatim from the DESIGN.md YAML `colors` block. */
export const palette = {
  surface: '#fff7f9',
  surfaceDim: '#e2d7db',
  surfaceBright: '#fff7f9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#fcf1f5',
  surfaceContainer: '#f6ebef',
  surfaceContainerHigh: '#f0e5e9',
  surfaceContainerHighest: '#eae0e4',
  onSurface: '#1f1a1d',
  onSurfaceVariant: '#4f434b',
  inverseSurface: '#342f32',
  inverseOnSurface: '#f9eef2',
  outline: '#81737b',
  outlineVariant: '#d2c2cb',
  surfaceTint: '#824c76',
  primary: '#42143b',
  onPrimary: '#ffffff',
  primaryContainer: '#5b2a52',
  onPrimaryContainer: '#d193c1',
  inversePrimary: '#f4b2e2',
  secondary: '#5e39e0',
  onSecondary: '#ffffff',
  secondaryContainer: '#7757fa',
  onSecondaryContainer: '#fffbff',
  tertiary: '#002d1c',
  onTertiary: '#ffffff',
  tertiaryContainer: '#00452d',
  onTertiaryContainer: '#1ebc84',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#ffd7f1',
  primaryFixedDim: '#f4b2e2',
  onPrimaryFixed: '#35082f',
  onPrimaryFixedVariant: '#67355d',
  secondaryFixed: '#e6deff',
  secondaryFixedDim: '#cabeff',
  onSecondaryFixed: '#1c0062',
  onSecondaryFixedVariant: '#4816cb',
  tertiaryFixed: '#70fbbd',
  tertiaryFixedDim: '#50dea3',
  onTertiaryFixed: '#002113',
  onTertiaryFixedVariant: '#005236',
  background: '#fff7f9',
  onBackground: '#1f1a1d',
  surfaceVariant: '#eae0e4',
} as const;

/** Present in the reference HTML but absent from the YAML, so defined once here. */
export const brand = {
  /** Plum → coral, 135°. Primary buttons, self chat bubble, active nav dot. */
  primaryGradient: ['#5B2A52', '#FF5C8A'] as const,
  /** Accent/border violet. YAML `secondary` (#5e39e0) is the fill; this is the accent. */
  secondaryViolet: '#7C5CFF',
  /** Reserved EXCLUSIVELY for the Sona Mark (minted & owned). Never decorative. */
  verifiedGreen: '#16B981',
  /** 10% glow that always accompanies the Sona Mark. */
  verifiedGlow: 'rgba(22, 185, 129, 0.1)',
  /** Deep warm near-black plum used for body/ghost text in the prose spec. */
  ink: '#1E1524',
} as const;

/** Glassmorphism (DESIGN.md "Elevation & Depth"). */
export const glass = {
  fill: 'rgba(255, 255, 255, 0.62)',
  blurIntensity: 20,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderWidth: 1,
} as const;

/**
 * The YAML `rounded` scale does not reach the radii the reference actually uses,
 * so the component-level values are carried alongside it.
 */
export const radius = {
  // YAML `rounded`, converted rem -> px at 16px root.
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  // Derived from the reference screens.
  card: 28,
  bubble: 20,
  /** The "sharpened" corner on a chat bubble's tail side. */
  bubbleTail: 4,
  input: 16,
  sheet: 28,
} as const;

/** Verbatim from the DESIGN.md YAML `spacing` block. */
export const spacing = {
  containerMargin: 20,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
} as const;

/** 8px base rhythm (DESIGN.md "Layout & Spacing"). */
export const space = (multiple: number): number => multiple * 8;

/** Content padding inside cards, matched to the 28px radius. */
export const CARD_PADDING = 24;

/** Chat stays intimate on wide displays (DESIGN.md "Reflow"). */
export const SOCIAL_TRACK_MAX_WIDTH = 600;

/** Minimum accessible touch target. */
export const MIN_TOUCH_TARGET = 48;

/** Floating nav sits 24px off the bottom (DESIGN.md "Floating Pill Navigation"). */
export const FLOATING_NAV_OFFSET = 24;

/**
 * Font family names, keyed to the files loaded in `theme/fonts.ts`.
 * React Native has no synthetic weight mapping — each weight is its own family.
 */
export const fontFamily = {
  headline: 'BricolageGrotesque_700Bold',
  headlineBold: 'BricolageGrotesque_800ExtraBold',
  body: 'Inter_400Regular',
  label: 'Inter_600SemiBold',
} as const;

/** Verbatim from the DESIGN.md YAML `typography` block. */
export const typography = {
  headlineXl: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8, // -0.02em @ 40px
  },
  headlineLg: {
    fontFamily: fontFamily.headline,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32, // -0.01em @ 32px
  },
  headlineMd: {
    fontFamily: fontFamily.headline,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  labelMd: {
    fontFamily: fontFamily.label,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.14, // 0.01em @ 14px
  },
  labelSm: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.36, // 0.03em @ 12px
  },
} as const;

export type TypographyVariant = keyof typeof typography;

/**
 * Shadows. DESIGN.md prefers glass over drop shadows; these are the two soft plum
 * shadows the reference does use.
 */
export const shadow = {
  /** Cards + glass panels: `0 4px 20px rgba(66,20,59,0.04)`. */
  card: {
    shadowColor: '#42143B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  /** Primary button: coral-tinted lift, `0 4px 14px rgba(255,92,138,0.25)`. */
  primaryButton: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  /** Bottom sheet, shadow cast upward: `0 -8px 30px rgba(66,20,59,0.08)`. */
  sheet: {
    shadowColor: '#42143B',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 16,
  },
} as const;

/** Pressed-state scale used across interactive elements (`active:scale-[0.98]`). */
export const PRESS_SCALE = 0.98;
