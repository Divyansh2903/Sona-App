import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import {
  buildCharacterPayload,
  CHARACTERS_COLLECTION,
  parseCharacterDoc,
  type CharacterDoc,
} from '@/models/character';
import { buildTxnPayload, TXN_ITEMS_SUBCOLLECTION, TXNS_COLLECTION } from '@/models/txn';
import { USERS_COLLECTION } from '@/models/user';
import { db } from '@/services/firebase';
import type { MintResult } from '@/services/mint.service';

/**
 * Writes what the chain already decided into Firestore.
 *
 * Everything here is an index. If any of it fails the user still owns their Sona —
 * the restore scan rebuilds these rows from chain — so callers must not treat a
 * write failure as a failed mint.
 */

/**
 * Records a completed mint: the character index row, the user's active identity,
 * and the activity-feed entry.
 *
 * Keyed on the mint address and the signature, so replaying the same mint
 * overwrites rather than duplicating.
 */
export async function recordMint(walletAddress: string, result: MintResult): Promise<void> {
  await setDoc(
    doc(db, CHARACTERS_COLLECTION, result.mintAddress),
    buildCharacterPayload({
      mintAddress: result.mintAddress,
      ownerWallet: walletAddress,
      catalogId: result.catalogId,
      metadataUri: result.metadataUri,
      name: result.name,
      amountSol: result.amountSol,
      txSignature: result.txSignature,
    }),
    { merge: true },
  );

  await updateDoc(doc(db, USERS_COLLECTION, walletAddress), {
    primaryCharacterId: result.mintAddress,
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, TXNS_COLLECTION, walletAddress, TXN_ITEMS_SUBCOLLECTION, result.txSignature),
    buildTxnPayload({
      type: 'mint',
      amountSol: result.amountSol,
      counterparty: null,
      signature: result.txSignature,
    }),
    { merge: true },
  );
}

/** Re-points the index at a Sona recovered from chain, e.g. after a reinstall. */
export async function adoptRestoredCharacter(input: {
  walletAddress: string;
  mintAddress: string;
  catalogId: string;
  metadataUri: string;
  name: string;
  txSignature: string | null;
}): Promise<void> {
  await setDoc(
    doc(db, CHARACTERS_COLLECTION, input.mintAddress),
    {
      mintAddress: input.mintAddress,
      ownerWallet: input.walletAddress,
      catalogId: input.catalogId,
      metadataUri: input.metadataUri,
      name: input.name,
      isPrimary: true,
    },
    { merge: true },
  );

  await updateDoc(doc(db, USERS_COLLECTION, input.walletAddress), {
    primaryCharacterId: input.mintAddress,
    updatedAt: serverTimestamp(),
  });
}

export async function getCharacter(mintAddress: string): Promise<CharacterDoc | null> {
  const snapshot = await getDoc(doc(db, CHARACTERS_COLLECTION, mintAddress));
  const data = snapshot.data();
  return data === undefined ? null : parseCharacterDoc(snapshot.id, data);
}
