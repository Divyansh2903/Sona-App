import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuraBadge,
  Button,
  Card,
  CharacterCanvas,
  ChatBubble,
  Chip,
  EmptyState,
  FloatingTabBar,
  GlassPanel,
  Input,
  Loader,
  PriceSol,
  Sheet,
  SonaMark,
  Text,
  type TabKey,
} from '@/components';
import { MINT_FEE_SOL, SHOP_PRICE_SOL, TIP_PRESETS_SOL } from '@/config/constants';
import { theme } from '@/theme/theme';

/**
 * Dev-only gallery for eyeballing every shared component against the
 * `sona_app_ui/<screen>/screen.png` references. Phase 1 acceptance surface.
 *
 * Not shipped in the app shell — Phase 2 swaps this out for `RootNavigator`.
 */
export function ComponentGallery() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [selectedChip, setSelectedChip] = useState('Coffee');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing.stackMd, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <Section title="SonaMark — minted &amp; owned on-chain">
          <Row>
            <SonaMark size="sm" />
            <SonaMark size="md" />
            <SonaMark size="lg" />
          </Row>
          <Text variant="labelSm" color={theme.color.textMuted}>
            Concentric ring + dot in #16B981 with a 10% glow. Never a checkmark, and never labelled
            &quot;verified human&quot; — the app performs no humanity check.
          </Text>
        </Section>

        <Section title="Buttons">
          <Button label="Get started" trailingIcon={<Arrow />} />
          <Button label="I already have an account" variant="ghost" />
          <Button label="Send an intro" variant="secondary" />
          <Row>
            <Button label="Loading" loading fullWidth={false} size="md" />
            <Button label="Disabled" disabled fullWidth={false} size="md" />
          </Row>
        </Section>

        <Section title="PriceSol — all amounts are SOL, never USD">
          <Row>
            <PriceSol amountSol={MINT_FEE_SOL} subtitle="one-time mint fee" />
            <PriceSol amountSol={SHOP_PRICE_SOL.outfit} variant="headlineMd" />
          </Row>
          <Row>
            {TIP_PRESETS_SOL.map((amount) => (
              <PriceSol key={amount} amountSol={amount} color={theme.color.accent} />
            ))}
          </Row>
        </Section>

        <Section title="Card & GlassPanel">
          <Card>
            <Row>
              <Text variant="headlineMd" color={theme.color.primary}>
                @aria.skr
              </Text>
              <SonaMark size="sm" />
            </Row>
            <Text variant="bodyMd" color={theme.color.textMuted}>
              &quot;Looking for a coffee buddy to discuss Solana projects and minimal design.&quot;
            </Text>
          </Card>

          <GlassPanel style={styles.glassDemo}>
            <View style={styles.glassInner}>
              <Text variant="labelMd" color={theme.color.primary}>
                Glass panel · 62% white + 20px blur
              </Text>
            </View>
          </GlassPanel>
        </Section>

        <Section title="Chips">
          <Row wrap>
            {['Coffee', 'DeFi', 'Design', 'Hiking'].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={selectedChip === label}
                onPress={() => setSelectedChip(label)}
              />
            ))}
          </Row>
          <Row wrap>
            <Chip label="Generative Art" selected selectedStyle="soft" />
            <Chip label="Web Dev" selected selectedStyle="soft" />
            <Chip label="Unavailable" disabled />
          </Row>
        </Section>

        <Section title="Inputs">
          <Input
            label="Name your Sona"
            placeholder="Alex"
            value={name}
            onChangeText={setName}
            helperText="Up to 32 characters — written on-chain."
          />
          <Input
            label="Bio"
            placeholder="Tell people what you're into..."
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <Input
            label="Seeker ID"
            placeholder="alex.skr"
            value="not-a-valid-id"
            error="That Seeker ID is already taken."
          />
        </Section>

        <Section title="ChatBubble — renders decrypted text only">
          <ChatBubble
            isSelf={false}
            text="Hey! Saw we both like pour-over. What's your go-to roaster?"
            timestamp="9:41"
          />
          <ChatBubble
            isSelf
            text="Ha, I've been on a Kenyan single-origin kick lately."
            timestamp="9:44"
          />
          <ChatBubble
            isSelf
            text="Coffee's on me next time."
            tipAmountSol={0.01}
            timestamp="9:45"
          />
          <ChatBubble
            isSelf={false}
            kind="letter"
            text="I wrote you a longer letter this week — no rush replying."
            timestamp="Mon"
          />
        </Section>

        <Section title="AuraBadge">
          <AuraBadge level={24} />
          <AuraBadge level={7} tone="gradient" caption="on-chain · portable" />
        </Section>

        <Section title="CharacterCanvas">
          <CharacterCanvas name="Alex" seekerId="@alex.skr" owned />
          <Text variant="labelSm" color={theme.color.textMuted}>
            Placeholder state shown — catalog artwork lands in Phase 3.
          </Text>
        </Section>

        <Section title="Sheet">
          <Button
            label="Open mint confirm sheet"
            variant="secondary"
            onPress={() => setSheetOpen(true)}
          />
        </Section>

        <Section title="Loader & EmptyState">
          <Loader label="Confirming on-chain…" />
          <EmptyState
            title="No threads yet"
            description="Send an intro from Discover and it'll show up here."
            icon={
              <MaterialCommunityIcons
                name="message-text-outline"
                size={32}
                color={theme.color.primary}
              />
            }
            actionLabel="Find people"
            onAction={() => setActiveTab('discover')}
          />
          <EmptyState
            tone="error"
            title="Couldn't reach the network"
            description="Check your connection and try again."
            icon={<MaterialCommunityIcons name="wifi-off" size={32} color={theme.color.error} />}
            actionLabel="Retry"
            onAction={() => undefined}
          />
        </Section>
      </ScrollView>

      <FloatingTabBar activeTab={activeTab} onTabPress={setActiveTab} />

      <Sheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title="Mint your Sona"
        subtitle="A 1/1 NFT, owned by you on-chain."
      >
        <Card>
          <Row>
            <Text variant="bodyMd" color={theme.color.textMuted}>
              Mint fee
            </Text>
            <PriceSol amountSol={MINT_FEE_SOL} />
          </Row>
        </Card>
        <Button label="Approve in Seed Vault" onPress={() => setSheetOpen(false)} />
        <Button label="Cancel" variant="ghost" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text variant="headlineLg" color={theme.color.primary}>
        Sona
      </Text>
      <Text variant="labelSm" color={theme.color.textMuted} uppercase>
        Design system · Phase 1
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="labelSm" color={theme.color.textMuted} uppercase>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ children, wrap = false }: { children: React.ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && styles.wrap]}>{children}</View>;
}

function Arrow() {
  return <MaterialCommunityIcons name="arrow-right" size={20} color={theme.color.onPrimary} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.containerMargin,
    gap: theme.spacing.stackLg,
  },
  header: {
    gap: 4,
  },
  section: {
    gap: theme.spacing.stackSm,
  },
  sectionBody: {
    gap: theme.spacing.stackMd,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.stackSm,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  glassDemo: {
    // Glass needs something behind it to read as glass.
    backgroundColor: theme.color.surfaceMuted,
  },
  glassInner: {
    padding: theme.layout.cardPadding,
  },
});
