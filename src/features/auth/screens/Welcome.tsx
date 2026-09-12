import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootScreenProps } from '@/app/navigation/types';
import { Button } from '@/components/Button';
import { CharacterCanvas } from '@/components/CharacterCanvas';
import { GlassPanel } from '@/components/GlassPanel';
import { SonaMark } from '@/components/SonaMark';
import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

/**
 * Reference: `sona_app_ui/welcome_to_sona`.
 *
 * The reference copy claims "Everyone here is real" and "HUMAN VERIFIED". Sona
 * performs no humanity verification, so the promise here is the economic one
 * instead: a Sona is a paid 1/1 NFT you own. Nothing on this screen may imply a
 * verified human.
 */
export function Welcome({ navigation }: RootScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();

  const goToSignIn = () => navigation.navigate('SeedVaultSignIn');

  return (
    <View style={styles.root}>
      {/* Soft brand washes — the reference's blurred blobs, without a blur filter. */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing.stackMd, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineMd" color={theme.color.primary}>
            Sona
          </Text>

          <GlassPanel radius={theme.radius.full}>
            {/* Read as one phrase — the mark's own label ("Minted Sona, owned
                on-chain") would otherwise sound like a claim about the viewer. */}
            <View style={styles.pill} accessible accessibilityLabel="On-chain minted identity">
              <SonaMark size="sm" />
              <Text variant="labelSm" color={theme.color.verified}>
                ON-CHAIN
              </Text>
              <Text variant="labelSm" color={theme.color.textMuted} uppercase>
                Minted identity
              </Text>
            </View>
          </GlassPanel>
        </View>

        <View style={styles.hero}>
          <CharacterCanvas />
          {/* Floating depth chip, as in the reference — with honest copy. */}
          <GlassPanel radius={theme.radius.lg} style={styles.heroChip}>
            <View style={styles.heroChipInner}>
              <Text variant="labelMd" color={theme.color.primary}>
                Costly to fake.
              </Text>
            </View>
          </GlassPanel>
        </View>

        <View style={styles.valueProp}>
          <Text variant="headlineXl" color={theme.color.primary} align="center">
            Own who{'\n'}
            <Text variant="headlineXl" color={theme.color.secondary}>
              you are.
            </Text>
          </Text>

          <Text variant="labelSm" color={theme.color.textMuted} align="center" uppercase>
            Every profile is a minted, owned Sona — spam doesn&apos;t pay here.
          </Text>

          <Text variant="bodyLg" color={theme.color.textMuted} align="center">
            Slow social on Solana. Your Sona is a 1/1 NFT in your own wallet, not a profile anyone
            can spin up for free.
          </Text>
        </View>

        <View style={styles.actions}>
          {/* Onboarding progress: Welcome → sign in → choose your Sona (Phase 3). */}
          <View
            style={styles.dots}
            accessibilityRole="progressbar"
            accessibilityLabel="Step 1 of 3"
          >
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Button
            label="Get started"
            onPress={goToSignIn}
            trailingIcon={
              <MaterialCommunityIcons name="arrow-right" size={20} color={theme.color.onPrimary} />
            }
            accessibilityHint="Opens Seed Vault sign-in"
          />

          <Button
            label="I already have a Sona"
            onPress={goToSignIn}
            variant="ghost"
            size="md"
            accessibilityHint="Same wallet sign-in — Sona has no separate account system"
          />

          <View style={styles.footer}>
            <Text variant="labelSm" color={theme.color.textMuted}>
              on
            </Text>
            <Text variant="labelMd" color={theme.color.primary}>
              Solana Seeker
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.4,
  },
  blobTop: {
    top: -120,
    left: -110,
    backgroundColor: withAlpha('#F4B2E2', 0.55),
  },
  blobBottom: {
    bottom: -140,
    right: -120,
    backgroundColor: withAlpha('#E6DEFF', 0.7),
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.containerMargin,
    gap: theme.spacing.stackLg,
    maxWidth: theme.layout.socialTrackMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hero: {
    justifyContent: 'center',
  },
  heroChip: {
    position: 'absolute',
    left: -8,
    bottom: 64,
  },
  heroChipInner: {
    paddingHorizontal: theme.spacing.stackMd,
    paddingVertical: theme.spacing.stackSm,
  },
  valueProp: {
    gap: theme.spacing.stackSm,
    alignItems: 'center',
  },
  actions: {
    gap: theme.spacing.stackSm,
    marginTop: 'auto',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.stackSm,
    marginBottom: theme.spacing.stackMd,
  },
  dot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.border,
  },
  dotActive: {
    width: 32,
    backgroundColor: theme.color.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.6,
    marginTop: theme.spacing.stackSm,
  },
});
