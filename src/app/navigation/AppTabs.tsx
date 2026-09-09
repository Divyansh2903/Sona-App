import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FloatingTabBar, type TabKey } from '@/components/FloatingTabBar';
import { Loader } from '@/components/Loader';
import { PriceSol } from '@/components/PriceSol';
import { Text } from '@/components/Text';
import { useSession } from '@/hooks/useSession';
import type { SonaSession } from '@/services/auth.service';
import { getBalanceSol } from '@/services/solana.service';
import { theme, withAlpha } from '@/theme/theme';
import { shortenWallet } from '@/utils/shortenSkr';

/**
 * The signed-in app shell (SONA_TECHNICAL_PLAN.md §6.1).
 *
 * Tabs are local state driving the custom `FloatingTabBar` rather than a
 * navigator: §6.1 requires stack-pushed detail screens to HIDE the bar (the
 * "Semantic Shell Mandate"), which is simpler when the shell owns it.
 *
 * Discover / Threads land in Phases 4 and 5; You is filled out in Phase 6. What
 * ships here is the shell plus a real, verifiable You tab — the wallet the
 * session actually authorized and its on-chain balance.
 */
export function AppTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('you');
  const insets = useSafeAreaInsets();
  const session = useSession((state) => state.session);

  if (session === null) {
    // RootNavigator only mounts this while signed in; this is belt-and-braces.
    return <Loader fullscreen label="Loading your session" />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.stackMd,
            // Clear the floating pill (§5.2) plus its 24px dock offset.
            paddingBottom: insets.bottom + theme.layout.floatingNavOffset + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'you' ? (
          <YouTab session={session} />
        ) : (
          <EmptyState
            title={activeTab === 'discover' ? 'Discover is next' : 'Threads are coming'}
            description={
              activeTab === 'discover'
                ? 'Browsing minted Sonas arrives with the Discover feed.'
                : 'Encrypted threads arrive once chat ships.'
            }
            icon={
              <MaterialCommunityIcons
                name={activeTab === 'discover' ? 'compass-outline' : 'message-text-outline'}
                size={32}
                color={withAlpha(theme.color.primary, 0.5)}
              />
            }
          />
        )}
      </ScrollView>

      <FloatingTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

function YouTab({ session }: { session: SonaSession }) {
  const signOut = useSession((state) => state.signOut);
  const walletAddress = session.wallet.walletAddress;

  const balance = useQuery({
    queryKey: ['balance', walletAddress],
    queryFn: () => getBalanceSol(walletAddress),
  });

  return (
    <View style={styles.tab}>
      <View>
        <Text variant="headlineLg" color={theme.color.primary}>
          {session.user.displayName}
        </Text>
        <Text variant="labelMd" color={theme.color.textMuted}>
          {session.user.seekerId}
        </Text>
      </View>

      <Card>
        <View style={styles.row}>
          <MaterialCommunityIcons name="wallet-outline" size={20} color={theme.color.primary} />
          <Text variant="labelMd" color={theme.color.text}>
            {shortenWallet(walletAddress)}
          </Text>
        </View>

        <View style={styles.balance}>
          {balance.isPending && <Loader size="small" label="Reading balance" />}

          {balance.isError && (
            <Text variant="bodySm" color={theme.color.error}>
              Couldn&apos;t reach the network. Pull the app back up to retry.
            </Text>
          )}

          {balance.isSuccess && (
            <PriceSol
              amountSol={balance.data}
              variant="headlineMd"
              decimals={4}
              subtitle="wallet balance"
            />
          )}
        </View>
      </Card>

      <Card>
        <Text variant="labelMd" color={theme.color.primary}>
          No Sona yet
        </Text>
        <Text variant="bodySm" color={theme.color.textMuted} style={styles.cardBody}>
          Minting your 1/1 Sona is the next step. Until then your profile has no Sona Mark —
          the mark means a minted, owned Sona and nothing else.
        </Text>
      </Card>

      <Button label="Sign out" onPress={() => void signOut()} variant="secondary" size="md" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.containerMargin,
    maxWidth: theme.layout.socialTrackMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  tab: {
    gap: theme.spacing.stackMd,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.stackSm,
  },
  balance: {
    marginTop: theme.spacing.stackMd,
    minHeight: 48,
    justifyContent: 'center',
  },
  cardBody: {
    marginTop: 6,
  },
});
