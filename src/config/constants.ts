import { env } from '@/config/env';

/**
 * SOL-denominated pricing and feature flags (SONA_TECHNICAL_PLAN.md §6.4).
 * All amounts are SOL (◎) — there is no USD/USDC anywhere in Sona.
 * Placeholders for now; move to Remote Config before launch.
 */

/** Fee paid to the treasury when minting a 1/1 Sona NFT. */
export const MINT_FEE_SOL = 0.02;

/** Preset tip amounts offered in the tip sheet. */
export const TIP_PRESETS_SOL = [0.005, 0.01, 0.05] as const;

/** Character Shop pricing by item category. */
export const SHOP_PRICE_SOL = {
  trait_common: 0.005,
  trait_rare: 0.02,
  outfit: 0.03,
} as const;

export type ShopCategory = keyof typeof SHOP_PRICE_SOL;

/** Receives mint + shop fees. */
export const TREASURY_WALLET = env.solana.treasuryWallet;

/**
 * How Sona introduces itself to a wallet during MWA authorization (§6.2).
 *
 * `uri`/`icon` are intentionally omitted: wallets resolve `icon` relative to
 * `uri`, and pointing at a domain we do not own would be worse than showing no
 * icon at all. Fill both in once the catalog hostname exists (decision log #5) —
 * `icon` must then be a path relative to `uri`.
 */
export const APP_IDENTITY: { name: string; uri?: string; icon?: string } = {
  name: 'Sona',
};

/** On-chain NFT symbol, written into token metadata and matched during restore (§6.8). */
export const SONA_NFT_SYMBOL = 'SONA';

/** Max on-chain NFT name length enforced by Token Metadata. */
export const MAX_SONA_NAME_LENGTH = 32;

/** Memo prefix for on-chain breadcrumbs used by the tier-2 restore scan (§6.8). */
export const MEMO_PREFIX = 'sona:';

/** Watchdog for a hung wallet approval, so minting never looks frozen forever (§6.8). */
export const MINT_WATCHDOG_MS = 90_000;

export const FEATURE_FLAGS = {
  /** Opt-in Dating mode alongside the friends-first default. */
  datingMode: true,
  /** Optional "describe your vibe" catalog *filter* — never a generator (§6.6). */
  catalogVibeFilter: true,
} as const;
