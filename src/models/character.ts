import { serverTimestamp, Timestamp, type DocumentData, type FieldValue } from 'firebase/firestore';

/**
 * `characters/{mintAddress}` — an INDEX of what the chain already says.
 *
 * The document id is the on-chain mint address, so records are inherently unique
 * and this collection can be rebuilt at any time from a holdings scan. Nothing
 * here is authoritative: if Firestore and the chain disagree, the chain wins.
 */

export const CHARACTERS_COLLECTION = 'characters';

export interface CharacterMint {
  amountSol: number;
  txSignature: string;
  mintedAt: Date | null;
}

export interface CharacterDoc {
  /** The on-chain mint address; also the document id. */
  mintAddress: string;
  /** Current holder, as last read from chain. */
  ownerWallet: string;
  /** Which catalog design was picked. Shared designs across users are expected. */
  catalogId: string;
  metadataUri: string;
  /** The on-chain NFT name the user chose. */
  name: string;
  /** The wallet's active identity. A UX invariant, not a chain guarantee. */
  isPrimary: boolean;
  mint: CharacterMint;
}

export interface NewCharacterPayload {
  mintAddress: string;
  ownerWallet: string;
  catalogId: string;
  metadataUri: string;
  name: string;
  isPrimary: boolean;
  mint: { amountSol: number; txSignature: string; mintedAt: FieldValue };
}

export function buildCharacterPayload(input: {
  mintAddress: string;
  ownerWallet: string;
  catalogId: string;
  metadataUri: string;
  name: string;
  amountSol: number;
  txSignature: string;
}): NewCharacterPayload {
  return {
    mintAddress: input.mintAddress,
    ownerWallet: input.ownerWallet,
    catalogId: input.catalogId,
    metadataUri: input.metadataUri,
    name: input.name,
    isPrimary: true,
    mint: {
      amountSol: input.amountSol,
      txSignature: input.txSignature,
      mintedAt: serverTimestamp(),
    },
  };
}

/** Any signed-in session can write here, so every field is narrowed, never cast. */
export function parseCharacterDoc(mintAddress: string, data: DocumentData): CharacterDoc {
  const mint = asRecord(data.mint);

  return {
    mintAddress: asString(data.mintAddress) ?? mintAddress,
    ownerWallet: asString(data.ownerWallet) ?? '',
    catalogId: asString(data.catalogId) ?? '',
    metadataUri: asString(data.metadataUri) ?? '',
    name: asString(data.name) ?? '',
    isPrimary: typeof data.isPrimary === 'boolean' ? data.isPrimary : false,
    mint: {
      amountSol: asNumber(mint.amountSol, 0),
      txSignature: asString(mint.txSignature) ?? '',
      mintedAt: asDate(mint.mintedAt),
    },
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}
