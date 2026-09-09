import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /**
   * `gradient` fills the selected state with the primary gradient (interest/intent
   * pickers); `soft` uses the tinted fill the discover cards use for interest tags.
   */
  selectedStyle?: 'gradient' | 'soft';
  leadingIcon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Chip (SONA_TECHNICAL_PLAN.md §5.2) — selectable interest/trait pill.
 * Idle = white + border; selected = gradient or soft tint.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  selectedStyle = 'gradient',
  leadingIcon,
  style,
}: ChipProps) {
  const useGradient = selected && selectedStyle === 'gradient' && !disabled;
  const labelColor = getLabelColor(selected, selectedStyle, disabled);

  const body = (
    <View style={styles.content}>
      {leadingIcon}
      <Text variant="labelMd" color={labelColor}>
        {label}
      </Text>
    </View>
  );

  const containerStyle: ViewStyle[] = [
    styles.chip,
    selected && selectedStyle === 'soft' ? styles.softSelected : styles.idle,
    disabled ? styles.disabled : {},
  ];

  if (onPress === undefined) {
    return (
      <View style={[...containerStyle, style]}>
        {useGradient && <GradientFill />}
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Pairs the selected state with a role, never color alone (plan §3).
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !disabled && { transform: [{ scale: theme.motion.pressScale }] },
        style,
      ]}
    >
      {useGradient && <GradientFill />}
      {body}
    </Pressable>
  );
}

function GradientFill() {
  return (
    <LinearGradient
      colors={theme.gradient.primary}
      start={theme.gradientDirection.start}
      end={theme.gradientDirection.end}
      style={StyleSheet.absoluteFill}
    />
  );
}

function getLabelColor(
  selected: boolean,
  selectedStyle: 'gradient' | 'soft',
  disabled: boolean,
): string {
  if (disabled) return theme.color.onDisabled;
  if (!selected) return theme.color.textMuted;
  return selectedStyle === 'gradient' ? theme.color.onPrimary : theme.color.primary;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: theme.radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  idle: {
    backgroundColor: theme.color.card,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  softSelected: {
    backgroundColor: withAlpha(theme.color.primary, 0.08),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabled: {
    backgroundColor: theme.color.disabled,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
