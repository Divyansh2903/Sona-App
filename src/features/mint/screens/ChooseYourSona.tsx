import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CatalogPicker } from '@/components/CatalogPicker';
import { CharacterCanvas } from '@/components/CharacterCanvas';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { PriceSol } from '@/components/PriceSol';
import { Text } from '@/components/Text';
import { MAX_SONA_NAME_LENGTH, MINT_FEE_SOL } from '@/config/constants';
import { MintConfirmSheet } from '@/features/mint/components/MintConfirmSheet';
import { useMint } from '@/hooks/useMint';
import { useSession } from '@/hooks/useSession';
import {
  catalogIdFromMetadataUri,
  filterCatalog,
  getCatalog,
  getCatalogCharacter,
  getCatalogTags,
  isCatalogConfigured,
} from '@/services/catalog';
import { isValidSonaName } from '@/services/mint.service';
import { getExplorerUrl } from '@/services/solana.service';
import { theme, withAlpha } from '@/theme/theme';

/**
 * Reference: `sona_app_ui/mint_your_sona`. Pick a catalog design, name it, mint it.
 *
 * The screen never offers to mint until the chain has been asked what this wallet
 * already holds — a restored Sona always wins over a fresh, paid mint.
 */
export function ChooseYourSona() {
  const insets = useSafeAreaInsets();
  const session = useSession((state) => state.session);
  const setPrimaryCharacter = useSession((state) => state.setPrimaryCharacter);

  const status = useMint((state) => state.status);
  const restored = useMint((state) => state.restored);
  const pending = useMint((state) => state.pending);
  const error = useMint((state) => state.error);
  const slow = useMint((state) => state.slow);
  const result = useMint((state) => state.result);
  const checkExisting = useMint((state) => state.checkExisting);
  const mint = useMint((state) => state.mint);
  const dismissPending = useMint((state) => state.dismissPending);
  const reset = useMint((state) => state.reset);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const walletAddress = session?.wallet.walletAddress ?? '';
  const configured = isCatalogConfigured();

  useEffect(() => {
    if (walletAddress === '' || !configured) return;
    void checkExisting(walletAddress);
  }, [walletAddress, configured, checkExisting]);

  const catalog = useMemo(() => (configured ? getCatalog() : []), [configured]);
  const tags = useMemo(() => (configured ? getCatalogTags() : []), [configured]);
  const visible = useMemo(
    () => (vibe === null ? catalog : filterCatalog(catalog, vibe)),
    [catalog, vibe],
  );

  const selected = catalog.find((character) => character.catalogId === selectedId) ?? null;
  const minting = status === 'minting';
  const canMint = selected !== null && isValidSonaName(name) && !minting;

  if (!configured) {
    return (
      <EmptyState
        title="The catalog isn’t reachable yet"
        description="Set EXPO_PUBLIC_CATALOG_BASE_URI to the catalog host and restart with `pnpm start --clear`."
        tone="error"
        icon={
          <MaterialCommunityIcons name="cloud-off-outline" size={40} color={theme.color.error} />
        }
      />
    );
  }

  if (status === 'checking') {
    return <Loader fullscreen label="Checking what this wallet already owns" />;
  }

  if (status === 'success' && result !== null) {
    return (
      <MintReveal
        name={result.name}
        imageUrl={getCatalogCharacter(result.catalogId)?.imageUrl ?? selected?.imageUrl}
        signature={result.txSignature}
        onEnter={() => {
          setPrimaryCharacter(result.mintAddress);
          reset();
        }}
      />
    );
  }

  if (restored !== null) {
    // A restored Sona may know only its metadata URI, so the design is recovered
    // from that rather than left blank — this screen is the whole reveal.
    const restoredId =
      restored.catalogId === ''
        ? catalogIdFromMetadataUri(restored.metadataUri)
        : restored.catalogId;

    return (
      <MintReveal
        name={restored.name === '' ? 'Your Sona' : restored.name}
        imageUrl={
          restoredId === null ? undefined : (getCatalogCharacter(restoredId)?.imageUrl ?? undefined)
        }
        signature={restored.txSignature}
        restored
        onEnter={() => setPrimaryCharacter(restored.mintAddress)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing.stackLg, paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineLg" color={theme.color.text} align="center">
            Choose your Sona
          </Text>
          <Text variant="bodyMd" color={theme.color.textMuted} align="center">
            Pick a character and mint it as a 1/1 you own. It is yours on-chain, not ours.
          </Text>
        </View>

        {pending !== null && (
          <PendingNotice
            message={pending.error}
            onDismiss={() => void dismissPending()}
            onRecheck={() => void checkExisting(walletAddress)}
          />
        )}

        <CharacterCanvas
          imageUri={selected?.imageUrl}
          name={selected?.name}
          seekerId={session?.user.seekerId}
        />

        <View style={styles.vibeSection}>
          <Text
            variant="labelSm"
            color={theme.color.borderStrong}
            uppercase
            style={styles.vibeLabel}
          >
            Filter by vibe
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip label="All" selected={vibe === null} onPress={() => setVibe(null)} />
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={vibe === tag}
                onPress={() => setVibe(vibe === tag ? null : tag)}
              />
            ))}
          </ScrollView>
        </View>

        {visible.length === 0 ? (
          <EmptyState
            title="No characters match that vibe"
            description="Clear the filter to see the whole catalog."
            actionLabel="Clear filter"
            onAction={() => setVibe(null)}
          />
        ) : (
          <CatalogPicker
            characters={visible}
            selectedId={selectedId}
            onSelect={setSelectedId}
            disabled={minting}
            style={styles.picker}
          />
        )}

        <View style={styles.section}>
          <Input
            label="Name your Sona"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Nova"
            maxLength={MAX_SONA_NAME_LENGTH}
            editable={!minting}
            helperText={`Written on-chain. Up to ${MAX_SONA_NAME_LENGTH} characters.`}
            error={
              name.length > 0 && !isValidSonaName(name) ? 'Use at least 2 characters.' : undefined
            }
          />
        </View>

        {error !== null && <MintErrorNotice message={error.message} signature={error.signature} />}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.stackMd }]}>
        <PriceSol amountSol={MINT_FEE_SOL} subtitle="one-time mint fee" variant="headlineMd" />
        <Button
          label="Mint my Sona"
          onPress={() => setConfirming(true)}
          disabled={!canMint}
          loading={minting}
          style={styles.mintButton}
          accessibilityHint="Opens a confirmation before your wallet is asked to pay"
        />
      </View>

      <MintConfirmSheet
        visible={confirming}
        characterName={selected?.name ?? ''}
        sonaName={name.trim()}
        minting={minting}
        slow={slow}
        onDismiss={() => {
          if (!minting) setConfirming(false);
        }}
        onConfirm={() => {
          if (selected === null) return;
          void mint({
            walletAddress,
            catalogId: selected.catalogId,
            name,
            seekerId: session?.user.seekerId ?? '',
          }).then((minted) => {
            if (minted !== null) setConfirming(false);
          });
        }}
      />
    </View>
  );
}

/** Shown after a successful mint, and after a Sona is recovered from chain. */
function MintReveal({
  name,
  imageUrl,
  signature,
  restored = false,
  onEnter,
}: {
  name: string;
  imageUrl?: string;
  signature: string | null;
  restored?: boolean;
  onEnter: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, styles.reveal, { paddingTop: insets.top + theme.spacing.stackLg }]}>
      <Text variant="headlineLg" color={theme.color.text} align="center">
        {restored ? 'Welcome back' : 'It’s yours'}
      </Text>
      <Text variant="bodyMd" color={theme.color.textMuted} align="center">
        {restored
          ? 'We found your Sona on-chain. Nothing to pay — it was already minted.'
          : 'Minted to your wallet as a 1/1. Nobody can rewrite it, including us.'}
      </Text>

      <CharacterCanvas imageUri={imageUrl} name={name} owned />

      {signature !== null && (
        <Pressable
          onPress={() => void Linking.openURL(getExplorerUrl(signature))}
          accessibilityRole="link"
          accessibilityLabel="View the mint transaction in a block explorer"
          style={styles.explorer}
        >
          <MaterialCommunityIcons name="open-in-new" size={16} color={theme.color.accent} />
          <Text variant="labelMd" color={theme.color.accent}>
            View on explorer
          </Text>
        </Pressable>
      )}

      <Button label="Enter Sona" onPress={onEnter} fullWidth style={styles.enter} />
    </View>
  );
}

/**
 * A mint that started but never confirmed. The wording matters: the user may
 * already have paid, so nothing here invites them to simply try again.
 */
function PendingNotice({
  message,
  onDismiss,
  onRecheck,
}: {
  message: string | null;
  onDismiss: () => void;
  onRecheck: () => void;
}) {
  return (
    <View style={styles.pending} accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name="alert-outline" size={18} color={theme.color.text} />
      <View style={styles.pendingBody}>
        <Text variant="labelMd" color={theme.color.text}>
          A previous mint didn’t finish
        </Text>
        <Text variant="bodySm" color={theme.color.textMuted}>
          {message ?? 'It may still have gone through. Check the chain before minting again.'}
        </Text>
        <View style={styles.pendingActions}>
          <Button label="Check again" variant="secondary" size="md" onPress={onRecheck} />
          <Button label="Dismiss" variant="ghost" size="md" onPress={onDismiss} />
        </View>
      </View>
    </View>
  );
}

function MintErrorNotice({ message, signature }: { message: string; signature: string | null }) {
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.color.error} />
      <View style={styles.pendingBody}>
        <Text variant="bodySm" color={theme.color.onErrorContainer}>
          {message}
        </Text>
        {signature !== null && (
          <Pressable
            onPress={() => void Linking.openURL(getExplorerUrl(signature))}
            accessibilityRole="link"
            accessibilityLabel="View the transaction in a block explorer"
          >
            <Text variant="labelMd" color={theme.color.accent}>
              View on explorer
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  content: {
    gap: theme.spacing.stackLg,
  },
  header: {
    gap: theme.spacing.stackSm,
    paddingHorizontal: theme.layout.cardPadding,
  },
  section: {
    gap: theme.spacing.stackSm,
    paddingHorizontal: theme.layout.cardPadding,
  },
  vibeSection: {
    gap: theme.spacing.stackSm,
  },
  vibeLabel: {
    paddingHorizontal: theme.layout.cardPadding,
  },
  chips: {
    flexDirection: 'row',
    gap: theme.spacing.stackSm,
    paddingRight: theme.layout.cardPadding,
  },
  picker: {
    marginHorizontal: -theme.layout.cardPadding,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.stackMd,
    paddingHorizontal: theme.layout.cardPadding,
    paddingTop: theme.spacing.stackMd,
    backgroundColor: theme.color.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    ...theme.shadow.sheet,
  },
  mintButton: {
    flexShrink: 1,
  },
  reveal: {
    gap: theme.spacing.stackMd,
    paddingHorizontal: theme.layout.cardPadding,
    justifyContent: 'center',
  },
  explorer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.stackSm,
    minHeight: theme.layout.minTouchTarget,
  },
  enter: {
    marginTop: theme.spacing.stackSm,
  },
  pending: {
    flexDirection: 'row',
    gap: theme.spacing.stackSm,
    marginHorizontal: theme.layout.cardPadding,
    padding: theme.spacing.stackMd,
    borderRadius: theme.radius.lg,
    backgroundColor: withAlpha(theme.color.accent, 0.08),
  },
  pendingBody: {
    flex: 1,
    gap: theme.spacing.stackSm,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.stackSm,
  },
  error: {
    flexDirection: 'row',
    gap: theme.spacing.stackSm,
    marginHorizontal: theme.layout.cardPadding,
    padding: theme.spacing.stackMd,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.errorContainer,
  },
});
