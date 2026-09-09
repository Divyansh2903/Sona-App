import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/** The SOL glyph. Sona never renders USD or USDC. */
export const SOL_SYMBOL = '◎';

/**
 * Formats a SOL amount as `◎ 0.02`.
 *
 * With no `decimals`, trailing zeros are trimmed (0.5 -> "◎ 0.5", 0.02 -> "◎ 0.02")
 * but at least two places are kept so prices read as currency.
 */
export function formatSol(amountSol: number, decimals?: number): string {
  if (!Number.isFinite(amountSol)) return `${SOL_SYMBOL} —`;

  if (decimals !== undefined) {
    return `${SOL_SYMBOL} ${amountSol.toFixed(decimals)}`;
  }

  // Up to 4dp, minimum 2, no trailing zeros beyond that.
  const fixed = amountSol.toFixed(4);
  const trimmed = fixed.replace(/(\.\d{2}[1-9]*?)0+$/, '$1');
  return `${SOL_SYMBOL} ${trimmed}`;
}

/** Converts lamports (as returned by `getBalance`) to SOL. */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/** Converts SOL to whole lamports, for building transfer instructions. */
export function solToLamports(amountSol: number): number {
  return Math.round(amountSol * LAMPORTS_PER_SOL);
}
