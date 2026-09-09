import { Connection, PublicKey, type Commitment } from '@solana/web3.js';

import { env } from '@/config/env';
import { lamportsToSol } from '@/utils/formatSol';

/**
 * Solana RPC access (SONA_TECHNICAL_PLAN.md §6.4).
 *
 * Screens never touch web3.js directly (§3) — everything chain-side goes through
 * this service or `wallet.service`. Reads happen here; anything that needs a
 * signature goes through `wallet.service` (MWA).
 */

/** Reads settle at `confirmed`; the mint flow re-confirms authoritatively (§6.8). */
export const DEFAULT_COMMITMENT: Commitment = 'confirmed';

/**
 * The wallet-standard chain identifier handed to MWA `authorize`.
 * MWA 2.0 takes `solana:<network>`; `mainnet-beta` is spelled `mainnet` there.
 */
export const SOLANA_CHAIN: `solana:${string}` =
  env.solana.cluster === 'devnet' ? 'solana:devnet' : 'solana:mainnet';

let connection: Connection | null = null;

/** Lazily-created singleton — a Connection opens sockets, so don't make one per call. */
export function getConnection(): Connection {
  connection ??= new Connection(env.solana.rpcUrl, DEFAULT_COMMITMENT);
  return connection;
}

/** True when `address` is a syntactically valid base58 Solana address. */
export function isValidWalletAddress(address: string): boolean {
  try {
    // Constructing throws on bad base58 / wrong length; on-curve is not required
    // here because PDAs are legitimate addresses elsewhere in the app.
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/** Parses a base58 address, throwing a message that names the offending value. */
export function toPublicKey(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Not a valid Solana address: "${address}"`);
  }
}

/** Current balance in SOL. Throws if the RPC is unreachable — callers show the error state. */
export async function getBalanceSol(address: string): Promise<number> {
  const lamports = await getConnection().getBalance(toPublicKey(address), DEFAULT_COMMITMENT);
  return lamportsToSol(lamports);
}

/** Explorer link for a signature or address, cluster-aware (devnet needs the query param). */
export function getExplorerUrl(value: string, kind: 'tx' | 'address' = 'tx'): string {
  const suffix = env.solana.cluster === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/${kind}/${value}${suffix}`;
}
