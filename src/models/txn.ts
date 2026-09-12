import { serverTimestamp, Timestamp, type DocumentData, type FieldValue } from 'firebase/firestore';

/**
 * `txns/{walletAddress}/items/{txId}` — the wallet activity feed, mirroring
 * on-chain history. Append-only by rule: every row is checkable against the chain
 * by its signature, so nothing here needs to be editable.
 *
 * The document id is the transaction signature, which makes writes idempotent —
 * replaying the same mint cannot produce a duplicate entry.
 */

export const TXNS_COLLECTION = 'txns';
export const TXN_ITEMS_SUBCOLLECTION = 'items';

export type TxnType = 'mint' | 'tip' | 'purchase' | 'receive';

export interface TxnDoc {
  type: TxnType;
  amountSol: number;
  counterparty: string | null;
  signature: string;
  ts: Date | null;
}

export interface NewTxnPayload {
  type: TxnType;
  amountSol: number;
  counterparty: string | null;
  signature: string;
  ts: FieldValue;
}

export function buildTxnPayload(input: {
  type: TxnType;
  amountSol: number;
  counterparty: string | null;
  signature: string;
}): NewTxnPayload {
  return { ...input, ts: serverTimestamp() };
}

export function parseTxnDoc(signature: string, data: DocumentData): TxnDoc {
  return {
    type: asType(data.type),
    amountSol:
      typeof data.amountSol === 'number' && Number.isFinite(data.amountSol) ? data.amountSol : 0,
    counterparty: typeof data.counterparty === 'string' ? data.counterparty : null,
    signature:
      typeof data.signature === 'string' && data.signature !== '' ? data.signature : signature,
    ts: data.ts instanceof Timestamp ? data.ts.toDate() : null,
  };
}

const TXN_TYPES: readonly TxnType[] = ['mint', 'tip', 'purchase', 'receive'];

function asType(value: unknown): TxnType {
  return typeof value === 'string' && (TXN_TYPES as readonly string[]).includes(value)
    ? (value as TxnType)
    : 'receive';
}
