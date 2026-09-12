import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from '@solana/web3.js';

import {
  MAX_SONA_NAME_LENGTH,
  MEMO_PREFIX,
  MINT_FEE_SOL,
  SONA_NFT_SYMBOL,
  TREASURY_WALLET,
} from '@/config/constants';
import { env } from '@/config/env';
import { getCatalogCharacter } from '@/services/catalog';
import { DEFAULT_COMMITMENT, getConnection, toPublicKey } from '@/services/solana.service';
import { withAuthorizedWallet } from '@/services/wallet.service';
import { solToLamports } from '@/utils/formatSol';

/**
 * Builds and sends the one atomic transaction that creates a user's 1/1 Sona.
 *
 * The app holds no key. The user's wallet pays and signs; the only other signer is
 * an ephemeral mint keypair generated here and discarded when this module's call
 * returns. There is no backend and no project-held mint authority, so the chain is
 * the sole authority for who owns what.
 */

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const BREADCRUMB_KEY = 'sona.mint.inflight';
const SEND_ATTEMPTS = 3;
const CONFIRM_TIMEOUT_MS = 60_000;
const CONFIRM_POLL_MS = 2_000;
const PRIORITY_FEE_TTL_MS = 60_000;
const FALLBACK_PRIORITY_FEE = 1_000;

export type MintErrorCode =
  | 'catalog_missing'
  | 'invalid_name'
  | 'insufficient_funds'
  | 'simulation_failed'
  | 'send_failed'
  | 'not_confirmed'
  | 'unknown';

export class MintError extends Error {
  readonly code: MintErrorCode;
  /** Present once a transaction was broadcast, whatever its outcome. */
  readonly signature: string | null;

  constructor(
    code: MintErrorCode,
    message: string,
    options?: { cause?: unknown; signature?: string | null },
  ) {
    super(message, options);
    this.name = 'MintError';
    this.code = code;
    this.signature = options?.signature ?? null;
  }
}

export interface MintInput {
  walletAddress: string;
  catalogId: string;
  /** The user's chosen Sona name; written on-chain. */
  name: string;
  seekerId: string;
}

export interface MintResult {
  mintAddress: string;
  txSignature: string;
  catalogId: string;
  name: string;
  metadataUri: string;
  amountSol: number;
}

/**
 * A mint that was started but never confirmed.
 *
 * Persisted BEFORE the wallet opens, so a crash, a force-quit, or a wallet that
 * never returns still leaves evidence that the user may already have paid. The
 * next launch checks the chain before ever offering to mint again.
 */
export interface MintBreadcrumb {
  walletAddress: string;
  mintAddress: string;
  catalogId: string;
  name: string;
  startedAt: number;
  signature: string | null;
  /** `failed` survives restarts so the user sees the error, not a clean button. */
  stage: 'in_flight' | 'failed';
  error: string | null;
}

export async function readBreadcrumb(): Promise<MintBreadcrumb | null> {
  const raw = await AsyncStorage.getItem(BREADCRUMB_KEY);
  if (raw === null) return null;
  try {
    return parseBreadcrumb(JSON.parse(raw));
  } catch {
    await clearBreadcrumb();
    return null;
  }
}

export async function clearBreadcrumb(): Promise<void> {
  await AsyncStorage.removeItem(BREADCRUMB_KEY);
}

async function writeBreadcrumb(breadcrumb: MintBreadcrumb): Promise<void> {
  await AsyncStorage.setItem(BREADCRUMB_KEY, JSON.stringify(breadcrumb));
}

function parseBreadcrumb(value: unknown): MintBreadcrumb | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const walletAddress = raw.walletAddress;
  const mintAddress = raw.mintAddress;
  if (typeof walletAddress !== 'string' || walletAddress === '') return null;
  if (typeof mintAddress !== 'string' || mintAddress === '') return null;

  return {
    walletAddress,
    mintAddress,
    catalogId: typeof raw.catalogId === 'string' ? raw.catalogId : '',
    name: typeof raw.name === 'string' ? raw.name : '',
    startedAt: typeof raw.startedAt === 'number' ? raw.startedAt : 0,
    signature: typeof raw.signature === 'string' ? raw.signature : null,
    stage: raw.stage === 'failed' ? 'failed' : 'in_flight',
    error: typeof raw.error === 'string' ? raw.error : null,
  };
}

/** Trimmed, and short enough for the on-chain name field. */
export function normalizeSonaName(name: string): string {
  return name.trim().slice(0, MAX_SONA_NAME_LENGTH);
}

export function isValidSonaName(name: string): boolean {
  const normalized = normalizeSonaName(name);
  return normalized.length >= 2 && normalized.length <= MAX_SONA_NAME_LENGTH;
}

/**
 * Mints the chosen catalog character as a 1/1 NFT owned by the user's wallet.
 *
 * Opens the wallet exactly once. Every failure after that point leaves a
 * breadcrumb, because a transaction that was broadcast may still land after this
 * function throws.
 */
export async function mintSona(input: MintInput): Promise<MintResult> {
  const character = getCatalogCharacter(input.catalogId);
  if (character === null) {
    throw new MintError('catalog_missing', `Unknown catalog character "${input.catalogId}".`);
  }

  const name = normalizeSonaName(input.name);
  if (!isValidSonaName(name)) {
    throw new MintError('invalid_name', 'Pick a name between 2 and 32 characters.');
  }

  const connection = getConnection();
  const owner = toPublicKey(input.walletAddress);
  const mintKeypair = Keypair.generate();
  const mintAddress = mintKeypair.publicKey.toBase58();

  await writeBreadcrumb({
    walletAddress: input.walletAddress,
    mintAddress,
    catalogId: input.catalogId,
    name,
    startedAt: Date.now(),
    signature: null,
    stage: 'in_flight',
    error: null,
  });

  try {
    // Everything that must be fresh at signing time happens inside the wallet
    // session: the blockhash is fetched here, not before, because wallet approval
    // can take 30 seconds and a stale blockhash is a dead transaction on arrival.
    const { signed, blockhash, lastValidBlockHeight } = await withAuthorizedWallet(
      async (wallet) => {
        const [latest, rentExempt, priorityFee] = await Promise.all([
          connection.getLatestBlockhash(DEFAULT_COMMITMENT),
          getMinimumBalanceForRentExemptMint(connection),
          getPriorityFee(connection),
        ]);

        const transaction = buildMintTransaction({
          owner,
          mintKeypair,
          name,
          seekerId: input.seekerId,
          catalogId: character.catalogId,
          metadataUri: character.metadataUri,
          rentExempt,
          priorityFee,
          blockhash: latest.blockhash,
        });

        // The ephemeral mint signs first; the wallet countersigns as fee payer.
        transaction.partialSign(mintKeypair);

        await simulate(connection, transaction);

        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });
        const result = signedTransactions[0];
        if (result === undefined) {
          throw new MintError('send_failed', 'The wallet returned no signed transaction.');
        }

        return {
          signed: result,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        };
      },
    );

    // The wallet session is closed by now — MWA sessions stay as short as possible,
    // and sending does not need the wallet.
    const signature = await send(connection, signed.serialize());
    await writeBreadcrumb({
      walletAddress: input.walletAddress,
      mintAddress,
      catalogId: input.catalogId,
      name,
      startedAt: Date.now(),
      signature,
      stage: 'in_flight',
      error: null,
    });

    await confirm(connection, signature, lastValidBlockHeight, blockhash);
    await clearBreadcrumb();

    return {
      mintAddress,
      txSignature: signature,
      catalogId: character.catalogId,
      name,
      metadataUri: character.metadataUri,
      amountSol: MINT_FEE_SOL,
    };
  } catch (error) {
    const mintError = toMintError(error);
    // Kept across restarts so the next launch shows what happened instead of a
    // clean Mint button the user might pay for twice.
    await writeBreadcrumb({
      walletAddress: input.walletAddress,
      mintAddress,
      catalogId: input.catalogId,
      name,
      startedAt: Date.now(),
      signature: mintError.signature,
      stage: 'failed',
      error: mintError.message,
    });
    throw mintError;
  }
}

interface BuildInput {
  owner: PublicKey;
  mintKeypair: Keypair;
  name: string;
  seekerId: string;
  catalogId: string;
  metadataUri: string;
  rentExempt: number;
  priorityFee: number;
  blockhash: string;
}

/**
 * One atomic transaction. Ordering matters: the mint account must exist before it
 * is initialized, hold a token before its metadata is written, and carry metadata
 * before a master edition can be attached.
 */
function buildMintTransaction(input: BuildInput): Transaction {
  const mint = input.mintKeypair.publicKey;
  const ata = getAssociatedTokenAddressSync(mint, input.owner);
  const metadata = findMetadataPda(mint);
  const masterEdition = findMasterEditionPda(mint);

  const transaction = new Transaction();
  transaction.feePayer = input.owner;
  transaction.recentBlockhash = input.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: input.priorityFee }),

    // The mint fee. Nothing here is escrowed — the treasury is paid in the same
    // transaction that creates the NFT, so there is no half-paid state.
    SystemProgram.transfer({
      fromPubkey: input.owner,
      toPubkey: toPublicKey(TREASURY_WALLET),
      lamports: solToLamports(MINT_FEE_SOL),
    }),

    SystemProgram.createAccount({
      fromPubkey: input.owner,
      newAccountPubkey: mint,
      space: MINT_SIZE,
      lamports: input.rentExempt,
      programId: TOKEN_PROGRAM_ID,
    }),

    // Decimals 0 and a supply of 1 is what makes this NFT-shaped rather than a
    // fungible token. Both authorities are the user's — the app keeps neither.
    createInitializeMint2Instruction(mint, 0, input.owner, input.owner, TOKEN_PROGRAM_ID),

    createAssociatedTokenAccountInstruction(input.owner, ata, input.owner, mint),

    createMintToInstruction(mint, ata, input.owner, 1, [], TOKEN_PROGRAM_ID),

    createCreateMetadataAccountV3Instruction(
      {
        metadata,
        mint,
        mintAuthority: input.owner,
        payer: input.owner,
        // Update authority is the USER, deliberately: Sona's promise is genuine
        // ownership, so nobody — including us — can rewrite what a user owns.
        updateAuthority: input.owner,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: input.name,
            symbol: SONA_NFT_SYMBOL,
            uri: input.metadataUri,
            sellerFeeBasisPoints: 0,
            creators: [{ address: input.owner, verified: true, share: 100 }],
            collection: collectionOrNull(),
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      },
    ),

    // maxSupply 0 is what makes this a true 1/1: no prints can ever be made.
    createCreateMasterEditionV3Instruction(
      {
        edition: masterEdition,
        mint,
        updateAuthority: input.owner,
        mintAuthority: input.owner,
        payer: input.owner,
        metadata,
      },
      { createMasterEditionArgs: { maxSupply: 0 } },
    ),

    buildMemoInstruction(input),
  );

  return transaction;
}

/**
 * An on-chain breadcrumb the restore scan can find by walking transaction history,
 * folded into the same transaction so it can never be orphaned or cost a second
 * wallet prompt.
 */
function buildMemoInstruction(input: BuildInput): TransactionInstruction {
  const payload = JSON.stringify({
    mintAddress: input.mintKeypair.publicKey.toBase58(),
    catalogId: input.catalogId,
    name: input.name,
    seekerId: input.seekerId,
  });

  return new TransactionInstruction({
    keys: [{ pubkey: input.owner, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(`${MEMO_PREFIX}mint|${payload}`, 'utf8'),
  });
}

/** Unverified on purpose: verifying would need the collection authority's signature. */
function collectionOrNull(): { key: PublicKey; verified: boolean } | null {
  const mint = env.solana.nftCollectionMint.trim();
  if (mint === '') return null;
  try {
    return { key: toPublicKey(mint), verified: false };
  } catch {
    // A malformed collection address must not block minting.
    return null;
  }
}

export function findMetadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

export function findMasterEditionPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition'),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

/** Median of recent fees, cached briefly — one RPC round trip per mint, not per build. */
let priorityFeeCache: { value: number; at: number } | null = null;

async function getPriorityFee(connection: Connection): Promise<number> {
  const cached = priorityFeeCache;
  if (cached !== null && Date.now() - cached.at < PRIORITY_FEE_TTL_MS) return cached.value;

  try {
    const recent = await connection.getRecentPrioritizationFees();
    const fees = recent
      .map((entry) => entry.prioritizationFee)
      .filter((fee) => fee > 0)
      .sort((a, b) => a - b);

    const middle = fees[Math.floor(fees.length / 2)];
    const value = middle ?? FALLBACK_PRIORITY_FEE;
    priorityFeeCache = { value, at: Date.now() };
    return value;
  } catch {
    // A missing fee estimate is not worth failing a mint over.
    return FALLBACK_PRIORITY_FEE;
  }
}

/** Catches doomed transactions before the user is ever asked to approve one. */
async function simulate(connection: Connection, transaction: Transaction): Promise<void> {
  let result;
  try {
    result = await connection.simulateTransaction(transaction);
  } catch (error) {
    // A simulation that cannot run is not a simulation that failed; let the real
    // send be the judge rather than blocking a mint on a flaky RPC.
    return void error;
  }

  if (result.value.err === null) return;

  const logs = result.value.logs ?? [];
  const insufficient = logs.some((line) => /insufficient (lamports|funds)/i.test(line));

  if (insufficient) {
    throw new MintError(
      'insufficient_funds',
      'This wallet does not have enough SOL to cover the mint fee and rent.',
    );
  }

  throw new MintError(
    'simulation_failed',
    `The mint transaction would fail on-chain: ${JSON.stringify(result.value.err)}`,
  );
}

async function send(connection: Connection, raw: Buffer | Uint8Array): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < SEND_ATTEMPTS; attempt += 1) {
    try {
      return await connection.sendRawTransaction(raw, {
        skipPreflight: true,
        maxRetries: 0,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw new MintError('send_failed', 'The mint transaction could not be broadcast.', {
    cause: lastError,
  });
}

/**
 * Confirms without ever trusting a timeout.
 *
 * Running out of time proves nothing about whether the transaction landed, so an
 * expiry is followed by an authoritative history search. Reporting a successful
 * mint as failed would push the user into paying twice.
 */
async function confirm(
  connection: Connection,
  signature: string,
  lastValidBlockHeight: number,
  blockhash: string,
): Promise<void> {
  void blockhash;
  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const status = (await connection.getSignatureStatuses([signature])).value[0];

    if (status !== null && status !== undefined) {
      if (status.err !== null) {
        throw new MintError('not_confirmed', 'The mint transaction failed on-chain.', {
          signature,
        });
      }
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
        return;
      }
    }

    // Once the blockhash expires the transaction can never land, so stop early
    // rather than burning the rest of the window.
    const height = await connection.getBlockHeight(DEFAULT_COMMITMENT).catch(() => 0);
    if (height > lastValidBlockHeight) break;

    await delay(CONFIRM_POLL_MS);
  }

  const authoritative = (
    await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })
  ).value[0];

  if (authoritative !== null && authoritative !== undefined && authoritative.err === null) return;

  throw new MintError(
    'not_confirmed',
    'The mint was sent but has not confirmed yet. Check the explorer before trying again.',
    { signature },
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toMintError(error: unknown): MintError {
  if (error instanceof MintError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new MintError('unknown', message === '' ? 'The mint failed.' : message, { cause: error });
}
