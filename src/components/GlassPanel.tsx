import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme/theme';

export interface GlassPanelProps {
  children: React.ReactNode;
  /** Defaults to the card radius; pass `theme.radius.full` for the nav pill. */
  radius?: number;
  style?: ViewStyle;
  /** Blur strength; defaults to the 20px token from DESIGN.md. */
  intensity?: number;
}

/**
 * The app's depth primitive: 62% white fill, 20px blur, 1px 20%-white border.
 * Used for the floating nav, headers, and prompt cards.
 */
export function GlassPanel({
  children,
  radius = theme.radius.card,
  style,
  intensity = theme.glass.blurIntensity,
}: GlassPanelProps) {
  return (
    <View style={[styles.container, { borderRadius: radius }, theme.shadow.card, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      {/* BlurView alone reads too dark over vivid art; the 62% white fill is the token. */}
      <View style={[StyleSheet.absoluteFill, styles.fill]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: theme.glass.borderWidth,
    borderColor: theme.glass.borderColor,
  },
  fill: {
    backgroundColor: theme.glass.fill,
  },
  content: {
    // Establishes a stacking context above the two absolute layers.
    position: 'relative',
  },
});
