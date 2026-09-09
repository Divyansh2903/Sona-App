import Constants from 'expo-constants';

/**
 * Typed, validated access to the app environment (SONA_TECHNICAL_PLAN.md §7).
 *
 * Two sources:
 *  - `EXPO_PUBLIC_*` — inlined by Metro at build time. These MUST be referenced as
 *    static `process.env.EXPO_PUBLIC_X` member expressions; Metro does a literal
 *    text substitution, so dynamic lookup (`process.env[key]`) yields undefined.
 *  - `extra` — everything else, forwarded by `app.config.ts`.
 *
 * Nothing here is secret; see §9.
 */

export type SolanaCluster = 'devnet' | 'mainnet-beta';

interface Extra {
  treasuryWallet: string;
  messageEncryptionKey: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

const raw = {
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  solanaRpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL,
  solanaCluster: process.env.EXPO_PUBLIC_SOLANA_CLUSTER,
  nftCollectionMint: process.env.EXPO_PUBLIC_NFT_COLLECTION_MINT,
  catalogBaseUri: process.env.EXPO_PUBLIC_CATALOG_BASE_URI,
  treasuryWallet: extra.treasuryWallet,
  messageEncryptionKey: extra.messageEncryptionKey,
} satisfies Record<string, string | undefined>;

/** Env vars that must be present for the app to function at all. */
const REQUIRED = [
  'firebaseApiKey',
  'firebaseAuthDomain',
  'firebaseProjectId',
  'firebaseStorageBucket',
  'firebaseAppId',
  'solanaRpcUrl',
  'solanaCluster',
  'treasuryWallet',
  'messageEncryptionKey',
] as const satisfies readonly (keyof typeof raw)[];

/** Maps our camelCase keys back to the `.env` names, for a useful error message. */
const ENV_NAMES: Record<keyof typeof raw, string> = {
  firebaseApiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  firebaseAuthDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  firebaseProjectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  firebaseStorageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  firebaseAppId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
  solanaRpcUrl: 'EXPO_PUBLIC_SOLANA_RPC_URL',
  solanaCluster: 'EXPO_PUBLIC_SOLANA_CLUSTER',
  nftCollectionMint: 'EXPO_PUBLIC_NFT_COLLECTION_MINT',
  catalogBaseUri: 'EXPO_PUBLIC_CATALOG_BASE_URI',
  treasuryWallet: 'TREASURY_WALLET',
  messageEncryptionKey: 'MESSAGE_ENCRYPTION_KEY',
};

function validate(): void {
  const missing = REQUIRED.filter((key) => {
    const value = raw[key];
    return value === undefined || value.trim() === '';
  }).map((key) => ENV_NAMES[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\n` +
        `Copy .env.example to .env and fill these in. ` +
        `Restart the bundler with \`pnpm start --clear\` after editing .env — ` +
        `EXPO_PUBLIC_* values are inlined at build time and are not hot-reloaded.`,
    );
  }

  // The message key must decode to exactly 32 bytes for NaCl secretbox (§6.5).
  const keyBytes = decodeBase64Length(raw.messageEncryptionKey ?? '');
  if (keyBytes !== 32) {
    throw new Error(
      `MESSAGE_ENCRYPTION_KEY must be 32 bytes of base64 (got ${keyBytes}). Generate with:\n` +
        `  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
}

/** Byte length of a base64 string, without pulling in a decoder. */
function decodeBase64Length(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length % 4 !== 0) return -1;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return -1;
  const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
  return (trimmed.length / 4) * 3 - padding;
}

validate();

function required(key: (typeof REQUIRED)[number]): string {
  // Safe: `validate()` threw above if any required key was absent.
  return raw[key] as string;
}

export const env = {
  firebase: {
    apiKey: required('firebaseApiKey'),
    authDomain: required('firebaseAuthDomain'),
    projectId: required('firebaseProjectId'),
    storageBucket: required('firebaseStorageBucket'),
    appId: required('firebaseAppId'),
  },
  solana: {
    rpcUrl: required('solanaRpcUrl'),
    cluster: required('solanaCluster') as SolanaCluster,
    treasuryWallet: required('treasuryWallet'),
    /** Optional collection grouping for minted Sonas (§6.8). */
    nftCollectionMint: raw.nftCollectionMint ?? '',
  },
  catalog: {
    baseUri: raw.catalogBaseUri ?? '',
  },
  crypto: {
    messageEncryptionKey: required('messageEncryptionKey'),
  },
} as const;

export const isDevnet = env.solana.cluster === 'devnet';
