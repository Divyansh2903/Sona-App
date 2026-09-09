import {
  SolanaMobileWalletAdapterError,
  SolanaMobileWalletAdapterErrorCode,
  type Account,
  type AuthorizationResult,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {
  transact,
  type Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, type Transaction, type VersionedTransaction } from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';

import { APP_IDENTITY } from '@/config/constants';
import { SOLANA_CHAIN, toPublicKey } from '@/services/solana.service';

/**
 * The only module that talks to a wallet.
 *
 * Importing it registers an Android TurboModule, so it cannot run in Expo Go or a
 * web bundle — a dev build is required and nothing here is testable off-device.
 *
 * Session model: MWA has no headless reauthorize. Every `transact()` foregrounds
 * the wallet app, so re-authorizing on launch would bounce the user out of Sona on
 * every cold start. The authorization is cached instead, and refreshed lazily in
 * `withAuthorizedWallet()` the next time a signature is actually needed.
 */

const SESSION_KEY = 'sona.wallet.session';

export type WalletErrorCode =
  | 'wallet_not_found'
  | 'cancelled'
  | 'timeout'
  | 'authorization_failed'
  | 'no_account'
  | 'signature_invalid'
  | 'unknown';

/** Carries a `code` so screens can render per-cause copy instead of parsing messages. */
export class WalletError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'WalletError';
    this.code = code;
  }
}

/** The cached MWA authorization. Small enough for SecureStore's value limit. */
export interface WalletSession {
  /** base58, and the key every document in the app is stored under. */
  walletAddress: string;
  authToken: string;
  label: string | null;
  chain: string;
  authorizedAt: number;
}

export interface ProvenConnection {
  session: WalletSession;
  /** The exact bytes the wallet was asked to sign. */
  challenge: Uint8Array;
  /** The 64-byte ed25519 signature, extracted from the wallet's signed payload. */
  signature: Uint8Array;
}

export async function loadSession(): Promise<WalletSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (raw === null) return null;

  try {
    return parseSession(JSON.parse(raw));
  } catch {
    // A corrupt entry must not wedge the app in a broken session forever.
    await clearSession();
    return null;
  }
}

export async function saveSession(session: WalletSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function parseSession(value: unknown): WalletSession | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const { walletAddress, authToken, label, chain, authorizedAt } = raw;

  if (typeof walletAddress !== 'string' || walletAddress === '') return null;
  if (typeof authToken !== 'string' || authToken === '') return null;

  return {
    walletAddress,
    authToken,
    label: typeof label === 'string' ? label : null,
    chain: typeof chain === 'string' ? chain : SOLANA_CHAIN,
    authorizedAt: typeof authorizedAt === 'number' ? authorizedAt : 0,
  };
}

/**
 * Authorizes, then has the wallet sign a challenge in the same `transact` — one
 * round-trip, so the user approves once rather than twice.
 *
 * `buildChallenge` receives the just-authorized address so the signed message can
 * name the wallet it belongs to.
 */
export async function connectAndProve(
  buildChallenge: (walletAddress: string) => Uint8Array,
): Promise<ProvenConnection> {
  return runTransact(async (wallet) => {
    const result = await wallet.authorize({ identity: APP_IDENTITY, chain: SOLANA_CHAIN });
    const account = firstAccount(result);
    const walletAddress = addressToBase58(account.address);
    const challenge = buildChallenge(walletAddress);

    const signedPayloads = await wallet.signMessages({
      addresses: [account.address],
      payloads: [challenge],
    });

    const signature = extractSignature(signedPayloads[0], challenge);
    const session = toSession(result, account, walletAddress);
    await saveSession(session);

    return { session, challenge, signature };
  });
}

/**
 * Runs `callback` against an authorized wallet, refreshing the cached token first
 * and falling back to a full `authorize` when it has been revoked. All signing
 * goes through here.
 */
export async function withAuthorizedWallet<T>(
  callback: (wallet: Web3MobileWallet, session: WalletSession) => Promise<T>,
): Promise<T> {
  const cached = await loadSession();

  return runTransact(async (wallet) => {
    let result: AuthorizationResult;

    if (cached !== null) {
      try {
        result = await wallet.reauthorize({
          auth_token: cached.authToken,
          identity: APP_IDENTITY,
        });
      } catch {
        result = await wallet.authorize({ identity: APP_IDENTITY, chain: SOLANA_CHAIN });
      }
    } else {
      result = await wallet.authorize({ identity: APP_IDENTITY, chain: SOLANA_CHAIN });
    }

    const account = firstAccount(result);
    const session = toSession(result, account, addressToBase58(account.address));
    await saveSession(session);

    return callback(wallet, session);
  });
}

/** Returns base58 signatures. */
export async function signAndSendTransactions(
  transactions: (Transaction | VersionedTransaction)[],
  options?: { minContextSlot?: number; skipPreflight?: boolean },
): Promise<string[]> {
  return withAuthorizedWallet(async (wallet) =>
    wallet.signAndSendTransactions({ transactions, ...options }),
  );
}

/** Revokes the authorization if the wallet is reachable, then forgets it locally. */
export async function disconnect(): Promise<void> {
  const cached = await loadSession();
  await clearSession();
  if (cached === null) return;

  try {
    await transact(async (wallet) => {
      await wallet.deauthorize({ auth_token: cached.authToken });
    });
  } catch {
    // The local session is already gone; a wallet that won't open (uninstalled,
    // user cancelled) must not block signing out.
  }
}

async function runTransact<T>(callback: (wallet: Web3MobileWallet) => Promise<T>): Promise<T> {
  try {
    return await transact(callback);
  } catch (error) {
    throw toWalletError(error);
  }
}

function toSession(
  result: AuthorizationResult,
  account: Account,
  walletAddress: string,
): WalletSession {
  return {
    walletAddress,
    authToken: result.auth_token,
    label: typeof account.label === 'string' ? account.label : null,
    chain: SOLANA_CHAIN,
    authorizedAt: Date.now(),
  };
}

function firstAccount(result: AuthorizationResult): Account {
  const account = result.accounts[0];
  if (account === undefined) {
    throw new WalletError('no_account', 'The wallet authorized Sona but returned no account.');
  }
  return account;
}

/**
 * MWA reports addresses as base64 (`Base64EncodedAddress`), but wallet-standard
 * accounts surfaced by MWA 2.0 wallets may carry base58 instead — and a 43-char
 * base58 address happens to decode as valid base64, so byte length alone cannot
 * tell them apart. Round-tripping the decode can: only a genuine base64 address
 * re-encodes to exactly the string we were given.
 */
export function addressToBase58(address: string): string {
  const decoded = Buffer.from(address, 'base64');
  if (isBase64Address(address, decoded)) {
    return new PublicKey(decoded).toBase58();
  }
  return toPublicKey(address).toBase58();
}

function isBase64Address(address: string, decoded: ReturnType<typeof Buffer.from>): boolean {
  if (decoded.length !== 32) return false;
  const reencoded = decoded.toString('base64');
  // Accept both padded and unpadded base64 — the MWA spec does not mandate one.
  return reencoded === address || reencoded.replace(/=+$/, '') === address;
}

/**
 * MWA returns the *signed payload*: for off-chain messages that is the original
 * message with the 64-byte signature appended. Some wallets return the bare
 * signature instead, so both shapes are accepted.
 */
function extractSignature(
  signedPayload: Uint8Array | undefined,
  challenge: Uint8Array,
): Uint8Array {
  if (signedPayload === undefined) {
    throw new WalletError('signature_invalid', 'The wallet returned no signature.');
  }
  if (signedPayload.length === 64) return signedPayload;
  if (signedPayload.length === challenge.length + 64) return signedPayload.slice(-64);

  throw new WalletError(
    'signature_invalid',
    `The wallet returned an unexpected signed payload (${signedPayload.length} bytes).`,
  );
}

function toWalletError(error: unknown): WalletError {
  if (error instanceof WalletError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const code = error instanceof Error && 'code' in error ? String(error.code) : '';

  if (
    error instanceof SolanaMobileWalletAdapterError &&
    error.code === SolanaMobileWalletAdapterErrorCode.ERROR_WALLET_NOT_FOUND
  ) {
    return new WalletError('wallet_not_found', 'No Solana wallet is installed on this device.', {
      cause: error,
    });
  }

  if (code === SolanaMobileWalletAdapterErrorCode.ERROR_WALLET_NOT_FOUND) {
    return new WalletError('wallet_not_found', 'No Solana wallet is installed on this device.', {
      cause: error,
    });
  }

  // Cancellation arrives as a plain rejection from the native module, not as a
  // typed error, so it has to be matched on text.
  if (
    /cancel/i.test(message) ||
    code === SolanaMobileWalletAdapterErrorCode.ERROR_ASSOCIATION_CANCELLED
  ) {
    return new WalletError('cancelled', 'Sign-in was cancelled in the wallet.', { cause: error });
  }

  if (
    /timed out|timeout/i.test(message) ||
    code === SolanaMobileWalletAdapterErrorCode.ERROR_SESSION_TIMEOUT
  ) {
    return new WalletError('timeout', 'The wallet took too long to respond.', { cause: error });
  }

  if (/authorization/i.test(message)) {
    return new WalletError('authorization_failed', 'The wallet declined to authorize Sona.', {
      cause: error,
    });
  }

  return new WalletError('unknown', message === '' ? 'The wallet request failed.' : message, {
    cause: error,
  });
}
