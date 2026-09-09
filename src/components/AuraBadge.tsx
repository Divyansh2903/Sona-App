import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface AuraBadgeProps {
  level: number;
  /** Micro-label under the level, e.g. "on-chain reputation · portable". */
  caption?: string;
  /** `gradient` for hero placements, `soft` inline. */
  tone?: 'gradient' | 'soft';
  /** Opens the AuraExplainer. */
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * "Lvl N Aura" pill with an on-chain
 * micro-label. Aura is the on-chain reputation tied to the user's Seeker ID.
 */
export function AuraBadge({
  level,
  caption = 'on-chain reputation · portable',
  tone = 'soft',
  onPress,
  style,
}: AuraBadgeProps) {
  const labelColor = tone === 'gradient' ? theme.color.onPrimary : theme.color.primary;
  const captionColor = tone === 'gradient' ? withAlpha('#FFFFFF', 0.75) : theme.color.textMuted;

  const body = (
    <>
      {tone === 'gradient' && (
        <LinearGradient
          colors={theme.gradient.primary}
          start={theme.gradientDirection.start}
          end={theme.gradientDirection.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.levelBlock}>
        <Text variant="labelMd" color={labelColor}>
          Lvl {level}
        </Text>
        <Text variant="labelMd" color={labelColor}>
          Aura
        </Text>
      </View>
      {caption !== '' && (
        <View style={[styles.divider, { backgroundColor: withAlpha(labelColor, 0.2) }]} />
      )}
      {caption !== '' && (
        <Text variant="labelSm" color={captionColor} style={styles.caption}>
          {caption}
        </Text>
      )}
    </>
  );

  const containerStyle = [styles.badge, tone === 'soft' && styles.soft, style];
  const a11yLabel = `Level ${level} Aura. ${caption}`;

  if (onPress === undefined) {
    return (
      <View style={containerStyle} accessibilityLabel={a11yLabel}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Learn how Aura grows"
      style={({ pressed }) => [
        ...containerStyle,
        pressed && { transform: [{ scale: theme.motion.pressScale }] },
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.stackSm,
    borderRadius: theme.radius.full,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.gutter,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  soft: {
    backgroundColor: theme.color.card,
    ...theme.shadow.card,
  },
  levelBlock: {
    gap: 0,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  caption: {
    maxWidth: 120,
  },
});
