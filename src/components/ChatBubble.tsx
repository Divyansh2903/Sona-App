import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { PriceSol } from '@/components/PriceSol';
import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface ChatBubbleProps {
  /** Already-decrypted body. Ciphertext must never reach this component (§6.5). */
  text: string;
  /** True when the message was sent by the current user. */
  isSelf: boolean;
  /** Letters render with a touch more breathing room than chat messages. */
  kind?: 'message' | 'letter';
  timestamp?: string;
  /** Attached SOL tip, if any (§6.4). */
  tipAmountSol?: number;
}

/**
 * ChatBubble (SONA_TECHNICAL_PLAN.md §5.2).
 *  - self:  gradient fill, white text, 20px radius with bottom-RIGHT sharpened to 4px
 *  - other: white surface, ink text, 20px radius with bottom-LEFT sharpened to 4px
 *
 * Renders DECRYPTED text only. Decryption happens in the thread layer; this
 * component never sees `{ ciphertext, nonce }`.
 */
export function ChatBubble({
  text,
  isSelf,
  kind = 'message',
  timestamp,
  tipAmountSol,
}: ChatBubbleProps) {
  const textColor = isSelf ? theme.color.onPrimary : theme.color.ink;
  const metaColor = isSelf ? withAlpha('#FFFFFF', 0.75) : theme.color.textMuted;

  return (
    <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          isSelf ? styles.bubbleSelf : styles.bubbleOther,
          kind === 'letter' && styles.letter,
        ]}
      >
        {isSelf && (
          <LinearGradient
            colors={theme.gradient.primary}
            start={theme.gradientDirection.start}
            end={theme.gradientDirection.end}
            style={StyleSheet.absoluteFill}
          />
        )}

        <Text variant={kind === 'letter' ? 'bodyLg' : 'bodyMd'} color={textColor}>
          {text}
        </Text>

        {tipAmountSol !== undefined && (
          <View style={[styles.tip, { borderTopColor: withAlpha(textColor, 0.2) }]}>
            <PriceSol amountSol={tipAmountSol} variant="labelSm" color={textColor} />
            <Text variant="labelSm" color={metaColor}>
              tip sent
            </Text>
          </View>
        )}

        {timestamp !== undefined && (
          <Text variant="labelSm" color={metaColor} style={styles.timestamp}>
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.stackSm,
  },
  rowSelf: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.gutter,
    paddingVertical: 12,
    overflow: 'hidden',
    gap: 4,
  },
  bubbleSelf: {
    borderTopLeftRadius: theme.radius.bubble,
    borderTopRightRadius: theme.radius.bubble,
    borderBottomLeftRadius: theme.radius.bubble,
    borderBottomRightRadius: theme.radius.bubbleTail,
  },
  bubbleOther: {
    backgroundColor: theme.color.card,
    borderTopLeftRadius: theme.radius.bubble,
    borderTopRightRadius: theme.radius.bubble,
    borderBottomRightRadius: theme.radius.bubble,
    borderBottomLeftRadius: theme.radius.bubbleTail,
    ...theme.shadow.card,
  },
  letter: {
    paddingHorizontal: theme.layout.cardPadding,
    paddingVertical: theme.spacing.gutter,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
  timestamp: {
    alignSelf: 'flex-end',
  },
});
