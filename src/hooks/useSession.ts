import { create } from 'zustand';

import * as authService from '@/services/auth.service';
import type { SonaSession } from '@/services/auth.service';
import { WalletError, type WalletErrorCode } from '@/services/wallet.service';

/**
 * Session state (SONA_TECHNICAL_PLAN.md §6.1, §6.2). `RootNavigator` gates on
 * `status`; screens read `session` for the wallet and user doc.
 */

export type SessionStatus =
  /** Reading the cached session at launch — show the splash/loader, not Welcome. */
  | 'restoring'
  | 'signed_out'
  /** A wallet approval is in flight; the app is backgrounded behind the wallet. */
  | 'connecting'
  | 'signed_in';

export interface SessionError {
  code: WalletErrorCode | 'unknown';
  message: string;
  /** Cancelling in the wallet is a normal outcome, not a failure to shout about. */
  benign: boolean;
}

interface SessionState {
  status: SessionStatus;
  session: SonaSession | null;
  error: SessionError | null;
  restore: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useSession = create<SessionState>()((set, get) => ({
  status: 'restoring',
  session: null,
  error: null,

  restore: async () => {
    try {
      const session = await authService.restore();
      set(
        session === null
          ? { status: 'signed_out', session: null }
          : { status: 'signed_in', session, error: null },
      );
    } catch (error) {
      // A failed restore is not a failed sign-in — fall back to onboarding.
      set({ status: 'signed_out', session: null, error: toSessionError(error) });
    }
  },

  signIn: async () => {
    // The wallet round-trip backgrounds the app; a second tap on return would
    // open a competing MWA session.
    if (get().status === 'connecting') return;

    set({ status: 'connecting', error: null });
    try {
      const session = await authService.signIn();
      set({ status: 'signed_in', session, error: null });
    } catch (error) {
      set({ status: 'signed_out', session: null, error: toSessionError(error) });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } finally {
      // Whatever the wallet says, the local session is gone.
      set({ status: 'signed_out', session: null, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));

const BENIGN_CODES: readonly WalletErrorCode[] = ['cancelled'];

function toSessionError(error: unknown): SessionError {
  if (error instanceof WalletError) {
    return {
      code: error.code,
      message: error.message,
      benign: BENIGN_CODES.includes(error.code),
    };
  }

  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'Something went wrong signing in.',
    benign: false,
  };
}
