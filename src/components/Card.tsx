import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme/theme';

export interface CardProps {
  children: React.ReactNode;
  /** Makes the whole card tappable (feed cards push to ProfileDetails). */
  onPress?: () => void;
  /** Set false when the child manages its own padding (e.g. a full-bleed image). */
  padded?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * White, 28px radius, soft plum shadow, 24px content padding.
 */
export function Card({ children, onPress, padded = true, style, accessibilityLabel }: CardProps) {
  const cardStyle = [styles.card, padded && styles.padded, style];

  if (onPress === undefined) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        cardStyle,
        pressed && { transform: [{ scale: theme.motion.pressScale }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.card,
    // Keeps full-bleed imagery inside the 28px corners.
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  padded: {
    padding: theme.layout.cardPadding,
  },
});
