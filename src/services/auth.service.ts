import { getRandomBytes } from 'expo-crypto';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import nacl from 'tweetnacl';

import { auth, db } from '@/services/firebase';
import { toPublicKey } from '@/services/solana.service';
import * as walletService from '@/services/wallet.service';
import { WalletError, type WalletSession } from '@/services/wallet.service';
import { parseUserDoc, buildNewUserPayload, USERS_COLLECTION, type UserDoc } from '@/models/user';

/**
 * Wallet authorize → sign a nonce → anonymous Firebase session → upsert the user.
 *
 * The nonce signature is verified locally because no server exists to verify it
 * against. It proves the wallet can sign for the address it just handed us; it is
 * not an ownership proof, and the first write to `users/{wallet}` claims that
 * wallet permanently.
 */

const NONCE_BYTES = 32;

export interface SonaSession {
  wallet: WalletSession;
  uid: string;
  user: UserDoc;
}

/** Prompts the wallet for approval. */
export async function signIn(): Promise<SonaSession> {
  const { session, challenge, signature } = await walletService.connectAndProve(buildChallenge);

  if (!verifyChallenge(session.walletAddress, challenge, signature)) {
    // The wallet signed with a key other than the account it authorized.
    await walletService.clearSession();
    throw new WalletError(
      'signature_invalid',
      "The wallet's signature did not match the account it authorized.",
    );
  }

  const uid = await ensureAnonymousUid();
  return buildSession(session, uid);
}

/** Restores on launch without touching the wallet — see the session model note in
 * `wallet.service`. */
export async function restore(): Promise<SonaSession | null> {
  const session = await walletService.loadSession();
  if (session === null) return null;

  const uid = await ensureAnonymousUid();
  return buildSession(session, uid);
}

/**
 * Drops the wallet authorization and deliberately keeps the Firebase session.
 *
 * Signing out of an anonymous account destroys its uid permanently — there is no
 * credential to sign back in with — so doing it here would strand every document
 * that uid created. The uid is a device identity; the wallet is the user identity,
 * and the wallet is what gets signed out.
 */
export async function signOut(): Promise<void> {
  await walletService.disconnect();
}

async function buildSession(wallet: WalletSession, uid: string): Promise<SonaSession> {
  const user = await upsertUser(wallet.walletAddress, uid);
  return { wallet, uid, user };
}

/**
 * Human-readable on purpose: wallets display these bytes to the user, and an
 * opaque blob is what a phishing prompt looks like.
 */
function buildChallenge(walletAddress: string): Uint8Array {
  const nonce = Buffer.from(getRandomBytes(NONCE_BYTES)).toString('hex');
  const message = [
    'Sona sign-in',
    '',
    'Signing proves this wallet is yours. It costs nothing and sends nothing.',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ].join('\n');

  return new Uint8Array(Buffer.from(message, 'utf8'));
}

function verifyChallenge(
  walletAddress: string,
  challenge: Uint8Array,
  signature: Uint8Array,
): boolean {
  try {
    return nacl.sign.detached.verify(challenge, signature, toPublicKey(walletAddress).toBytes());
  } catch {
    return false;
  }
}

async function ensureAnonymousUid(): Promise<string> {
  // Auth persistence resolves asynchronously; without this the check below races
  // and mints a second uid on every cold start.
  await auth.authStateReady();

  const existing = auth.currentUser;
  if (existing !== null) return existing.uid;

  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

/** `uid` is stored as a debugging breadcrumb; no rule and no caller treats it as proof. */
async function upsertUser(walletAddress: string, uid: string): Promise<UserDoc> {
  const ref = doc(db, USERS_COLLECTION, walletAddress);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, buildNewUserPayload(walletAddress, uid));
    const created = await getDoc(ref);
    const data = created.data();
    if (data === undefined) {
      throw new Error(`users/${walletAddress} vanished immediately after being created.`);
    }
    return parseUserDoc(walletAddress, data);
  }

  await updateDoc(ref, { uid, updatedAt: serverTimestamp() });
  return parseUserDoc(walletAddress, snapshot.data());
}
