import { create } from 'zustand';

import { MINT_WATCHDOG_MS } from '@/config/constants';
import * as characterService from '@/services/character.service';
import {
  clearBreadcrumb,
  mintSona,
  readBreadcrumb,
  MintError,
  type MintBreadcrumb,
  type MintResult,
} from '@/services/mint.service';
import { findOwnedSona, type RestoredSona } from '@/services/nftDetection';

/**
 * Drives the mint screen.
 *
 * The ordering rule that matters: nothing offers to mint until the chain has been
 * asked whether this wallet already owns a Sona. A user who paid once must never
 * be shown a clean Mint button.
 */

export type MintStatus =
  /** Asking the chain what this wallet already owns. Runs before the button appears. */
  'checking' | 'idle' | 'minting' | 'success' | 'error';

export interface MintFailure {
  code: string;
  message: string;
  /** Set when a transaction was broadcast — the user may already have paid. */
  signature: string | null;
}

interface MintState {
  status: MintStatus;
  result: MintResult | null;
  restored: RestoredSona | null;
  pending: MintBreadcrumb | null;
  error: MintFailure | null;
  /** The wallet approval has outlived the watchdog. Not a failure — the transaction may still land. */
  slow: boolean;
  checkExisting: (walletAddress: string) => Promise<RestoredSona | null>;
  mint: (input: {
    walletAddress: string;
    catalogId: string;
    name: string;
    seekerId: string;
  }) => Promise<MintResult | null>;
  dismissPending: () => Promise<void>;
  reset: () => void;
}

export const useMint = create<MintState>()((set, get) => ({
  status: 'checking',
  result: null,
  restored: null,
  pending: null,
  error: null,
  slow: false,

  /**
   * Runs before minting is offered, and again on every launch that finds a
   * breadcrumb. Restoring is always preferred to minting: a second mint would be a
   * second payment for an identity the wallet already holds.
   */
  checkExisting: async (walletAddress) => {
    set({ status: 'checking', error: null, slow: false });

    const pending = await readBreadcrumb().catch(() => null);
    const owned = await findOwnedSona(walletAddress);

    if (owned !== null) {
      // The chain settles it: whatever the breadcrumb said, the mint landed.
      await clearBreadcrumb();
      await characterService
        .adoptRestoredCharacter({
          walletAddress,
          mintAddress: owned.mintAddress,
          catalogId: owned.catalogId,
          metadataUri: owned.metadataUri,
          name: owned.name,
          txSignature: owned.txSignature,
        })
        .catch(() => {
          // Firestore is only an index; failing to update it does not un-own the NFT.
        });

      set({ status: 'idle', restored: owned, pending: null });
      return owned;
    }

    set({
      status: 'idle',
      restored: null,
      pending: pending !== null && pending.walletAddress === walletAddress ? pending : null,
    });
    return null;
  },

  mint: async (input) => {
    if (get().status === 'minting') return null;

    set({ status: 'minting', error: null, slow: false, result: null });

    // The wallet approval backgrounds Sona. If it never comes back, the screen must
    // say so rather than spinning forever — but the transaction may still be in
    // flight, so this flags slowness instead of declaring failure.
    const watchdog = setTimeout(() => {
      if (get().status === 'minting') set({ slow: true });
    }, MINT_WATCHDOG_MS);

    try {
      const result = await mintSona(input);
      await characterService.recordMint(input.walletAddress, result).catch(() => {
        // The NFT exists on-chain regardless; the index can be rebuilt by restore.
      });
      set({ status: 'success', result, error: null, pending: null });
      return result;
    } catch (error) {
      set({ status: 'error', error: toFailure(error) });
      return null;
    } finally {
      clearTimeout(watchdog);
      set({ slow: false });
    }
  },

  /** Clears a failed-mint breadcrumb once the user has acknowledged it. */
  dismissPending: async () => {
    await clearBreadcrumb();
    set({ pending: null });
  },

  reset: () => set({ status: 'idle', result: null, error: null, slow: false }),
}));

function toFailure(error: unknown): MintFailure {
  if (error instanceof MintError) {
    return { code: error.code, message: error.message, signature: error.signature };
  }
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'The mint failed.',
    signature: null,
  };
}
