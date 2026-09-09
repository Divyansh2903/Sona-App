import { Connection, PublicKey, type Commitment } from '@solana/web3.js';

import { env } from '@/config/env';
import { lamportsToSol } from '@/utils/formatSol';

/** Solana RPC reads. Anything needing a signature goes through `wallet.service`. */

export const DEFAULT_COMMITMENT: Commitment = 'confirmed';

/** MWA 2.0 takes `solana:<network>`, where `mainnet-beta` is spelled `mainnet`. */
export const SOLANA_CHAIN: `solana:${string}` =
  env.solana.cluster === 'devnet' ? 'solana:devnet' : 'solana:mainnet';

let connection: Connection | null = null;

export function getConnection(): Connection {
  connection ??= new Connection(env.solana.rpcUrl, DEFAULT_COMMITMENT);
  return connection;
}

export function isValidWalletAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/** Throws with a message naming the offending value, unlike `new PublicKey`. */
export function toPublicKey(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Not a valid Solana address: "${address}"`);
  }
}

export async function getBalanceSol(address: string): Promise<number> {
  const lamports = await getConnection().getBalance(toPublicKey(address), DEFAULT_COMMITMENT);
  return lamportsToSol(lamports);
}

export function getExplorerUrl(value: string, kind: 'tx' | 'address' = 'tx'): string {
  const suffix = env.solana.cluster === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/${kind}/${value}${suffix}`;
}
