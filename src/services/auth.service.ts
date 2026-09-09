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
 * Sign-in (SONA_TECHNICAL_PLAN.md §6.2).
 *
 * The flow is: authorize the wallet over MWA → have it sign a random nonce
 * (liveness) → open a Firebase **anonymous** session → upsert `users/{wallet}`.
 * There is no Google, email or password path anywhere in Sona (§6.2 #4).
 *
 * What the nonce signature does and does not buy us: there is no server to
 * verify it against (decision log #2), so the check is local. It proves the
 * wallet app can actually sign for the address it just handed us — which stops
 * an accidental mismatch — but it is NOT an ownership proof to Firestore. Per
 * §9 the first write to `users/{wallet}` claims that wallet, permanently.
 */

const NONCE_BYTES = 32;

export interface SonaSession {
  wallet: WalletSession;
  /** Anonymous Firebase uid backing this session. */
  uid: string;
  user: UserDoc;
}

/** Full sign-in: wallet approval required. */
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

/**
 * Restores a previous session on launch without touching the wallet.
 *
 * See the session-model note in `wallet.service` — re-associating with the
 * wallet on every cold start would foreground the wallet app, so the cached
 * authorization is trusted until a signature is actually needed.
 */
export async function restore(): Promise<SonaSession | null> {
  const session = await walletService.loadSession();
  if (session === null) return null;

  const uid = await ensureAnonymousUid();
  return buildSession(session, uid);
}

/**
 * Drops the wallet authorization — and deliberately KEEPS the anonymous Firebase
 * session alive.
 *
 * Signing out of an anonymous account destroys its uid permanently: there is no
 * credential to sign back in with. Because the rules grant writes on
 * `users/{wallet}` to the uid that claimed it (§9), calling `firebaseSignOut`
 * here would permanently brick write access to the user's own profile the first
 * time they tapped Sign out. Verified on device, 2026-07-31.
 *
 * The anonymous uid is a *device* identity, not a user identity. The wallet is
 * the user identity, and that is what actually gets signed out.
 */
export async function signOut(): Promise<void> {
  await walletService.disconnect();
}

// ─── Internals ───────────────────────────────────────────────────────────────

async function buildSession(wallet: WalletSession, uid: string): Promise<SonaSession> {
  const user = await upsertUser(wallet.walletAddress, uid);
  return { wallet, uid, user };
}

/**
 * The message the wallet is asked to sign. Human-readable on purpose — wallets
 * show these bytes to the user, and an opaque blob is exactly what a phishing
 * prompt looks like.
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

/** Reuses the persisted anonymous session when there is one; otherwise creates it. */
async function ensureAnonymousUid(): Promise<string> {
  // Auth persistence (AsyncStorage) resolves asynchronously — without this the
  // first launch check would race and mint a second uid.
  await auth.authStateReady();

  const existing = auth.currentUser;
  if (existing !== null) return existing.uid;

  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

/**
 * Creates or refreshes `users/{walletAddress}` (§4).
 *
 * Any signed-in session may update the doc (decision log #13), so a uid change —
 * reinstall, cleared app data — no longer locks the user out of their own
 * profile. `uid` is refreshed here only as a breadcrumb for whoever is debugging
 * later; nothing reads it as proof of anything (§9).
 */
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
