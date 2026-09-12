import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { PriceSol } from '@/components/PriceSol';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { MINT_FEE_SOL } from '@/config/constants';
import { theme, withAlpha } from '@/theme/theme';

export interface MintConfirmSheetProps {
  visible: boolean;
  characterName: string;
  sonaName: string;
  minting: boolean;
  /** The wallet has outlived the watchdog; the transaction may still land. */
  slow: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Last stop before the wallet opens.
 *
 * Undismissable while a mint is in flight: a stray backdrop tap here could orphan
 * a transaction the user has already approved and paid for.
 */
export function MintConfirmSheet({
  visible,
  characterName,
  sonaName,
  minting,
  slow,
  onConfirm,
  onDismiss,
}: MintConfirmSheetProps) {
  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      dismissable={!minting}
      title="Mint your Sona"
      subtitle="Your wallet signs and pays. Sona never holds a key."
    >
      <View style={styles.row}>
        <Text variant="bodySm" color={theme.color.textMuted}>
          Design
        </Text>
        <Text variant="labelMd" color={theme.color.text}>
          {characterName}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="bodySm" color={theme.color.textMuted}>
          Name
        </Text>
        <Text variant="labelMd" color={theme.color.text} numberOfLines={1} style={styles.value}>
          {sonaName}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text variant="bodySm" color={theme.color.textMuted}>
          One-time mint fee
        </Text>
        <PriceSol amountSol={MINT_FEE_SOL} variant="headlineMd" />
      </View>

      <View style={styles.note}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={theme.color.textMuted}
        />
        <Text variant="bodySm" color={theme.color.textMuted} style={styles.noteText}>
          Network rent and fees are paid on top of this, by your wallet.
        </Text>
      </View>

      {slow && (
        <View style={styles.slow} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.color.text} />
          <Text variant="bodySm" color={theme.color.text} style={styles.noteText}>
            Still waiting on your wallet. Don’t pay again — if this already went through, Sona will
            find it.
          </Text>
        </View>
      )}

      <Button
        label={minting ? 'Waiting for your wallet' : 'Approve in wallet'}
        onPress={onConfirm}
        loading={minting}
        fullWidth
        accessibilityHint="Opens your wallet to sign and pay for the mint"
      />

      <Button label="Not yet" variant="ghost" onPress={onDismiss} disabled={minting} fullWidth />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.stackSm,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.color.border,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.stackSm,
  },
  slow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.stackSm,
    padding: theme.spacing.stackMd,
    borderRadius: theme.radius.lg,
    backgroundColor: withAlpha(theme.color.accent, 0.08),
  },
  noteText: {
    flex: 1,
  },
});
