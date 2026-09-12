import { env } from '@/config/env';

/**
 * All amounts are SOL (◎) — there is no USD or USDC anywhere in Sona.
 * Placeholder prices; move to Remote Config before launch.
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
 * How Sona introduces itself to a wallet during authorization.
 *
 * `uri`/`icon` are omitted deliberately: wallets resolve `icon` relative to `uri`,
 * and pointing at a domain we do not own is worse than showing no icon. Fill both
 * in once the catalog hostname exists.
 */
export const APP_IDENTITY: { name: string; uri?: string; icon?: string } = {
  name: 'Sona',
};

/** Written into token metadata, and matched when restoring a Sona from chain. */
export const SONA_NFT_SYMBOL = 'SONA';

/** Max on-chain NFT name length enforced by Token Metadata. */
export const MAX_SONA_NAME_LENGTH = 32;

/** Prefixes the on-chain memo that the restore scan looks for. */
export const MEMO_PREFIX = 'sona:';

/** Bounds a hung wallet approval so minting never looks frozen forever. */
export const MINT_WATCHDOG_MS = 90_000;

export const FEATURE_FLAGS = {
  /** A catalog filter, never a generator — no AI ships in the app. */
  catalogVibeFilter: true,
} as const;
