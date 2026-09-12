import AsyncStorage from '@react-native-async-storage/async-storage';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, type Connection } from '@solana/web3.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { MEMO_PREFIX, MINT_FEE_SOL, SONA_NFT_SYMBOL, TREASURY_WALLET } from '@/config/constants';
import { CHARACTERS_COLLECTION, parseCharacterDoc } from '@/models/character';
import { isCatalogMetadataUri } from '@/services/catalog';
import { db } from '@/services/firebase';
import { findMetadataPda } from '@/services/mint.service';
import { DEFAULT_COMMITMENT, getConnection, toPublicKey } from '@/services/solana.service';
import { solToLamports } from '@/utils/formatSol';

/**
 * Finds the Sona a wallet already owns, so a returning user is never asked to pay
 * for an identity they have already bought.
 *
 * Three tiers, cheapest first. Only the third is authoritative: Firestore is an
 * index that may be empty or stale, and memos are a convenience. The holdings scan
 * reads the chain itself and works from a completely cold install.
 */

export type RestoreSource = 'firestore' | 'memo' | 'holdings';

export interface RestoredSona {
  mintAddress: string;
  ownerWallet: string;
  catalogId: string;
  name: string;
  metadataUri: string;
  txSignature: string | null;
  source: RestoreSource;
  /**
   * Whether the mint transaction was seen paying the treasury.
   *
   * A check, never a gate (plan §9). Because the mint is client-built with no
   * project signer, someone could craft a SONA-shaped NFT without paying, and a
   * holdings-only restore would accept it. Unverified Sonas still restore; the app
   * simply knows not to treat them as paid.
   */
  paidVerified: boolean;
}

const PAYMENT_CACHE_KEY = 'sona.mint.paidSignatures';
const MEMO_SCAN_LIMIT = 200;
const HOLDINGS_METADATA_BATCH = 100;

export async function findOwnedSona(walletAddress: string): Promise<RestoredSona | null> {
  const fromIndex = await fromFirestore(walletAddress).catch(() => null);
  if (fromIndex !== null) return fromIndex;

  const connection = getConnection();

  const fromMemo = await fromMemoScan(connection, walletAddress).catch(() => null);
  if (fromMemo !== null) return fromMemo;

  return fromHoldings(connection, walletAddress).catch(() => null);
}

/** Tier 1 — the index. Fast, and wrong whenever Firestore has been rebuilt. */
async function fromFirestore(walletAddress: string): Promise<RestoredSona | null> {
  const snapshot = await getDocs(
    query(collection(db, CHARACTERS_COLLECTION), where('ownerWallet', '==', walletAddress)),
  );
  if (snapshot.empty) return null;

  const characters = snapshot.docs.map((entry) => parseCharacterDoc(entry.id, entry.data()));

  // A wallet can accumulate several rows — an earlier Sona, a retired design — and
  // more than one may still claim `isPrimary`, so every candidate is tried rather
  // than only the first. Primaries are preferred, but a stale primary must not
  // shadow a Sona the wallet actually owns.
  const candidates = [
    ...characters.filter((character) => character.isPrimary),
    ...characters.filter((character) => !character.isPrimary),
  ];

  // The index is not authority. A row whose token has since been transferred or
  // burned, or which never pointed at a catalog Sona, is not ownership — whatever
  // Firestore still says. Verifying costs one extra read and keeps the chain the
  // only thing that decides.
  const connection = getConnection();
  let chosen: (typeof candidates)[number] | undefined;
  let onChain: OnChainMetadata | null = null;

  for (const candidate of candidates) {
    onChain = await verifyCatalogSona(connection, walletAddress, candidate.mintAddress);
    if (onChain !== null) {
      chosen = candidate;
      break;
    }
  }

  if (chosen === undefined || onChain === null) return null;

  return {
    mintAddress: chosen.mintAddress,
    ownerWallet: chosen.ownerWallet === '' ? walletAddress : chosen.ownerWallet,
    catalogId: chosen.catalogId,
    name: chosen.name,
    metadataUri: onChain.uri,
    txSignature: chosen.mint.txSignature === '' ? null : chosen.mint.txSignature,
    source: 'firestore',
    paidVerified: await isPaymentVerified(chosen.mint.txSignature),
  };
}

/**
 * Tier 2 — the on-chain memo written by the mint transaction.
 *
 * Signature listings carry the memo inline, so this costs one RPC call rather than
 * one per transaction.
 */
async function fromMemoScan(
  connection: Connection,
  walletAddress: string,
): Promise<RestoredSona | null> {
  const signatures = await connection.getSignaturesForAddress(toPublicKey(walletAddress), {
    limit: MEMO_SCAN_LIMIT,
  });

  for (const entry of signatures) {
    if (entry.err !== null) continue;
    const payload = parseMintMemo(entry.memo);
    if (payload === null) continue;

    // A memo only proves a mint once happened. It says nothing about whether the
    // wallet still holds the token, or whether the token is a catalog Sona at all,
    // so the claim is checked against the chain before it is believed.
    const onChain = await verifyCatalogSona(connection, walletAddress, payload.mintAddress);
    if (onChain === null) continue;

    return {
      mintAddress: payload.mintAddress,
      ownerWallet: walletAddress,
      catalogId: payload.catalogId,
      name: onChain.name === '' ? payload.name : onChain.name,
      metadataUri: onChain.uri,
      txSignature: entry.signature,
      source: 'memo',
      paidVerified: await verifyTreasuryPayment(entry.signature),
    };
  }

  return null;
}

/** True when `walletAddress` currently holds exactly one of `mintAddress`. */
async function holdsMint(
  connection: Connection,
  walletAddress: string,
  mintAddress: string,
): Promise<boolean> {
  try {
    const ata = getAssociatedTokenAddressSync(
      toPublicKey(mintAddress),
      toPublicKey(walletAddress),
    );
    const balance = await connection.getTokenAccountBalance(ata, DEFAULT_COMMITMENT);
    return balance.value.amount === '1';
  } catch {
    // A missing token account throws rather than returning zero.
    return false;
  }
}

/**
 * Confirms a mint is a Sona this wallet owns right now: held, symbol `SONA`, and
 * pointing at the configured catalog. Returns its on-chain metadata, or null.
 */
async function verifyCatalogSona(
  connection: Connection,
  walletAddress: string,
  mintAddress: string,
): Promise<OnChainMetadata | null> {
  if (!(await holdsMint(connection, walletAddress, mintAddress))) return null;

  try {
    const info = await connection.getAccountInfo(findMetadataPda(toPublicKey(mintAddress)));
    if (info === null) return null;

    const metadata = readMetadata(info.data);
    if (metadata === null) return null;
    if (metadata.symbol !== SONA_NFT_SYMBOL) return null;
    if (!isCatalogMetadataUri(metadata.uri)) return null;

    return metadata;
  } catch {
    return null;
  }
}

interface MintMemo {
  mintAddress: string;
  catalogId: string;
  name: string;
}

/**
 * Memos arrive prefixed with their length and program, e.g.
 * `[123] dGVzdA==  sona:mint|{...}`, so the marker is searched for rather than
 * expected at position zero.
 */
export function parseMintMemo(memo: string | null): MintMemo | null {
  if (memo === null) return null;

  const marker = `${MEMO_PREFIX}mint|`;
  const start = memo.indexOf(marker);
  if (start === -1) return null;

  const json = memo.slice(start + marker.length).trim();
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const raw = parsed as Record<string, unknown>;
    const mintAddress = raw.mintAddress;
    if (typeof mintAddress !== 'string' || mintAddress === '') return null;

    return {
      mintAddress,
      catalogId: typeof raw.catalogId === 'string' ? raw.catalogId : '',
      name: typeof raw.name === 'string' ? raw.name : '',
    };
  } catch {
    return null;
  }
}

/**
 * Tier 3 — authoritative. Enumerates the wallet's token accounts, keeps the
 * NFT-shaped ones, and reads their metadata to find a Sona. Works with an empty
 * Firestore and a truncated transaction history.
 */
async function fromHoldings(
  connection: Connection,
  walletAddress: string,
): Promise<RestoredSona | null> {
  const accounts = await connection.getParsedTokenAccountsByOwner(
    toPublicKey(walletAddress),
    { programId: TOKEN_PROGRAM_ID },
    DEFAULT_COMMITMENT,
  );

  const candidates = accounts.value.flatMap((entry): PublicKey[] => {
    const info = entry.account.data.parsed?.info as
      { mint?: unknown; tokenAmount?: { amount?: unknown; decimals?: unknown } } | undefined;
    const amount = info?.tokenAmount?.amount;
    const decimals = info?.tokenAmount?.decimals;
    const mint = info?.mint;

    // NFT-shaped: exactly one indivisible token.
    if (amount !== '1' || decimals !== 0 || typeof mint !== 'string') return [];
    try {
      return [new PublicKey(mint)];
    } catch {
      return [];
    }
  });

  for (let index = 0; index < candidates.length; index += HOLDINGS_METADATA_BATCH) {
    const batch = candidates.slice(index, index + HOLDINGS_METADATA_BATCH);
    const infos = await connection.getMultipleAccountsInfo(batch.map(findMetadataPda));

    for (let offset = 0; offset < batch.length; offset += 1) {
      const info = infos[offset];
      const mint = batch[offset];
      if (info === null || info === undefined || mint === undefined) continue;

      const metadata = readMetadata(info.data);
      if (metadata === null) continue;
      if (metadata.symbol !== SONA_NFT_SYMBOL) continue;
      if (!isCatalogMetadataUri(metadata.uri)) continue;

      return {
        mintAddress: mint.toBase58(),
        ownerWallet: walletAddress,
        catalogId: '',
        name: metadata.name,
        metadataUri: metadata.uri,
        txSignature: null,
        source: 'holdings',
        paidVerified: false,
      };
    }
  }

  return null;
}

interface OnChainMetadata {
  name: string;
  symbol: string;
  uri: string;
}

/**
 * Token Metadata stores fixed-length strings padded with null bytes, and some
 * wallets append query strings to URIs. Both are stripped so comparisons hold.
 */
function readMetadata(data: Buffer | Uint8Array): OnChainMetadata | null {
  try {
    const [metadata] = Metadata.deserialize(Buffer.from(data));
    return {
      name: trimOnChainString(metadata.data.name),
      symbol: trimOnChainString(metadata.data.symbol),
      uri: trimOnChainString(metadata.data.uri),
    };
  } catch {
    return null;
  }
}

function trimOnChainString(value: string): string {
  return value.replace(/\0+$/, '').trim();
}

/**
 * Confirms a mint transaction actually paid the treasury.
 *
 * Verify-and-cache, not a gate: the result is recorded so the check runs once per
 * signature, and a wallet whose Sona cannot be verified still restores.
 */
export async function verifyTreasuryPayment(signature: string): Promise<boolean> {
  if (signature === '') return false;
  if (await isPaymentVerified(signature)) return true;

  try {
    const transaction = await getConnection().getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (transaction === null) return false;

    const treasury = toPublicKey(TREASURY_WALLET).toBase58();
    const accounts = transaction.transaction.message.accountKeys.map((key) =>
      key.pubkey.toBase58(),
    );
    const treasuryIndex = accounts.indexOf(treasury);
    if (treasuryIndex === -1) return false;

    const before = transaction.meta?.preBalances[treasuryIndex];
    const after = transaction.meta?.postBalances[treasuryIndex];
    if (typeof before !== 'number' || typeof after !== 'number') return false;

    // Balance delta rather than instruction parsing: it holds however the transfer
    // was expressed, including through a future inner instruction.
    if (after - before < solToLamports(MINT_FEE_SOL)) return false;

    await rememberPayment(signature);
    return true;
  } catch {
    return false;
  }
}

async function readPaymentCache(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PAYMENT_CACHE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

async function isPaymentVerified(signature: string): Promise<boolean> {
  if (signature === '') return false;
  return (await readPaymentCache()).includes(signature);
}

async function rememberPayment(signature: string): Promise<void> {
  const cached = await readPaymentCache();
  if (cached.includes(signature)) return;
  await AsyncStorage.setItem(PAYMENT_CACHE_KEY, JSON.stringify([...cached, signature]));
}
