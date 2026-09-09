import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootScreenProps } from '@/app/navigation/types';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useSession, type SessionError } from '@/hooks/useSession';
import { theme, withAlpha } from '@/theme/theme';

/**
 * Reference: `sona_app_ui/seed_vault_sign_in`. The whole of Sona's auth surface —
 * one wallet, over Mobile Wallet Adapter.
 *
 * Two corrections to the reference: its "VERIFIED HUMAN" mark is gone, because
 * nothing is verified at sign-in and the Sona Mark means "minted, owned Sona" —
 * which no one is yet. And "Use PIN instead" is copy rather than a button, since
 * PIN-vs-biometric is the wallet's own fallback and Sona has nowhere to send it.
 */
export function SeedVaultSignIn({ navigation }: RootScreenProps<'SeedVaultSignIn'>) {
  const insets = useSafeAreaInsets();
  const status = useSession((state) => state.status);
  const error = useSession((state) => state.error);
  const signIn = useSession((state) => state.signIn);

  const connecting = status === 'connecting';

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={[styles.back, { top: insets.top + theme.spacing.stackSm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={connecting}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.primary} />
        </Pressable>
      </View>

      {/* Seed Vault hero, floating above the sheet as in the reference. */}
      <View style={styles.hero}>
        <View style={styles.heroRing}>
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={30}
            color={theme.color.primaryContainer}
          />
        </View>
        <Text variant="labelMd" color={theme.color.text} uppercase align="center">
          Secured by Seed Vault
        </Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.stackLg }]}>
        <View style={styles.handle} />

        <Text variant="headlineLg" color={theme.color.text} align="center">
          Sign in with Seed Vault
        </Text>
        <Text variant="bodyMd" color={theme.color.textMuted} align="center" style={styles.subtitle}>
          No password, no seed phrase — your keys stay in the phone.
        </Text>

        <Pressable
          onPress={() => void signIn()}
          disabled={connecting}
          accessibilityRole="button"
          accessibilityLabel="Sign in with your wallet"
          accessibilityState={{ disabled: connecting, busy: connecting }}
          style={({ pressed }) => [
            styles.sensor,
            pressed && !connecting && { transform: [{ scale: theme.motion.pressScale }] },
          ]}
        >
          <MaterialCommunityIcons
            name="fingerprint"
            size={44}
            color={theme.color.primaryContainer}
          />
          <View style={styles.sensorBadge}>
            <MaterialCommunityIcons name="shield" size={14} color={theme.color.primaryContainer} />
          </View>
        </Pressable>

        <Text variant="labelSm" color={theme.color.borderStrong} uppercase align="center">
          {connecting ? 'Waiting for your wallet' : 'Touch sensor'}
        </Text>

        {error !== null && !connecting && <SignInError error={error} />}

        <Button
          label={error !== null && !error.benign ? 'Try again' : 'Sign in with Seed Vault'}
          onPress={() => void signIn()}
          loading={connecting}
          style={styles.action}
          accessibilityHint="Opens your Solana wallet to approve Sona"
        />

        <Text variant="labelMd" color={theme.color.textMuted} align="center">
          Fingerprint or PIN — your wallet decides which.
        </Text>

        <Text variant="labelSm" color={theme.color.borderStrong} uppercase align="center">
          Keys never leave your phone
        </Text>
      </View>
    </View>
  );
}

/** Error copy is per-cause: a cancelled approval is not a failure. */
function SignInError({ error }: { error: SessionError }) {
  const tone = error.benign ? theme.color.textMuted : theme.color.error;

  return (
    <View
      style={[styles.error, error.benign ? styles.errorBenign : styles.errorHard]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name={error.benign ? 'information-outline' : 'alert-circle-outline'}
        size={18}
        color={tone}
      />
      <Text variant="bodySm" color={tone} style={styles.errorText}>
        {describe(error)}
      </Text>
    </View>
  );
}

function describe(error: SessionError): string {
  switch (error.code) {
    case 'cancelled':
      return 'Sign-in was cancelled. Tap again when you’re ready.';
    case 'wallet_not_found':
      return 'No Solana wallet found on this device. Install one that supports Mobile Wallet Adapter, then try again.';
    case 'timeout':
      return 'Your wallet didn’t respond in time. Try again.';
    case 'signature_invalid':
      return 'The wallet signed with a different account than it authorized. Try again, or pick a single account in your wallet.';
    case 'no_account':
      return 'Your wallet authorized Sona but shared no account.';
    default:
      return error.message;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.background,
    justifyContent: 'flex-end',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.45,
  },
  blobTop: {
    top: -90,
    right: -80,
    backgroundColor: withAlpha('#F4B2E2', 0.5),
  },
  blobBottom: {
    top: 140,
    left: -110,
    backgroundColor: withAlpha('#E6DEFF', 0.7),
  },
  back: {
    position: 'absolute',
    left: theme.spacing.stackSm,
    zIndex: 2,
  },
  backButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.stackSm,
    paddingBottom: theme.spacing.stackLg,
  },
  heroRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: withAlpha(theme.color.primaryContainer, 0.35),
    backgroundColor: withAlpha('#FFFFFF', 0.6),
  },
  sheet: {
    backgroundColor: theme.color.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingHorizontal: theme.layout.cardPadding,
    paddingTop: theme.spacing.stackMd,
    gap: theme.spacing.stackMd,
    alignItems: 'stretch',
    width: '100%',
    maxWidth: theme.layout.socialTrackMaxWidth,
    alignSelf: 'center',
    ...theme.shadow.sheet,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.surfaceMuted,
    alignSelf: 'center',
    marginBottom: theme.spacing.stackMd,
  },
  subtitle: {
    maxWidth: 280,
    alignSelf: 'center',
  },
  sensor: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.color.primaryContainer, 0.2),
    backgroundColor: withAlpha(theme.color.primaryContainer, 0.1),
  },
  sensorBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    padding: 5,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.card,
    borderWidth: 1,
    borderColor: withAlpha(theme.color.primaryContainer, 0.2),
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.stackSm,
    padding: theme.spacing.stackMd,
    borderRadius: theme.radius.lg,
  },
  errorBenign: {
    backgroundColor: theme.color.surfaceRaised,
  },
  errorHard: {
    backgroundColor: theme.color.errorContainer,
  },
  errorText: {
    flex: 1,
  },
  action: {
    marginTop: theme.spacing.stackSm,
  },
});
