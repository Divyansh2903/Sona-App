import { CATALOG_ENTRIES, CATALOG_VIBES, type CatalogEntry } from '@/config/catalogManifest';
import { env } from '@/config/env';

/**
 * Reads the bundled catalog manifest and resolves its asset URIs.
 *
 * The manifest ships with the app; only the hostname comes from the environment,
 * so pointing at a different catalog host is an `.env` change and a rebuild, never
 * a code change. URIs carry no query strings — wallets cache metadata by URI and a
 * per-mint suffix would defeat that.
 */

export interface CatalogCharacter extends CatalogEntry {
  /** Shown in the picker. */
  imageUrl: string;
  /** Written into the NFT's metadata account, verbatim. */
  metadataUri: string;
}

export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogError';
  }
}

function baseUri(): string {
  const raw = env.catalog.baseUri.trim();
  if (raw === '') {
    throw new CatalogError(
      'EXPO_PUBLIC_CATALOG_BASE_URI is not set, so catalog assets have nowhere to resolve to. ' +
        'Set it to the catalog host and restart with `pnpm start --clear`.',
    );
  }
  return raw.replace(/\/+$/, '');
}

export function isCatalogConfigured(): boolean {
  return env.catalog.baseUri.trim() !== '';
}

function resolve(entry: CatalogEntry): CatalogCharacter {
  const root = `${baseUri()}/catalog/${entry.catalogId}`;
  return { ...entry, imageUrl: `${root}/image.png`, metadataUri: `${root}/metadata.json` };
}

export function getCatalog(): CatalogCharacter[] {
  return CATALOG_ENTRIES.map(resolve);
}

export function getCatalogCharacter(catalogId: string): CatalogCharacter | null {
  const entry = CATALOG_ENTRIES.find((candidate) => candidate.catalogId === catalogId);
  return entry === undefined ? null : resolve(entry);
}

/** The vibe filter's chip row, in authored order rather than alphabetical. */
export function getCatalogTags(): string[] {
  return [...CATALOG_VIBES];
}

/**
 * Filters by tag or name. A filter, never a generator — this is the whole of the
 * "describe your vibe" feature.
 */
export function filterCatalog(characters: CatalogCharacter[], query: string): CatalogCharacter[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return characters;

  return characters.filter(
    (character) =>
      character.name.toLowerCase().includes(needle) ||
      character.tags.some((tag) => tag.includes(needle)),
  );
}

/**
 * Recovers the catalog id from a metadata URI, e.g.
 * `https://host/catalog/aurora/metadata.json` -> `aurora`.
 *
 * A Sona restored from a holdings scan carries only its on-chain metadata URI —
 * no catalog id — so this is how its artwork gets found again.
 */
export function catalogIdFromMetadataUri(uri: string): string | null {
  const match = /\/catalog\/([^/]+)\/metadata\.json/.exec(uri.trim().replace(/\0+$/, ''));
  return match?.[1] ?? null;
}

/**
 * True when `uri` looks like it came from this catalog. Used by the restore scan,
 * where the on-chain value may carry protocol drift or trailing padding, so the
 * comparison is deliberately loose about scheme and trailing characters.
 */
export function isCatalogMetadataUri(uri: string): boolean {
  if (!isCatalogConfigured()) return false;
  const normalize = (value: string): string =>
    value
      .trim()
      .replace(/\0+$/, '')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

  return normalize(uri).startsWith(`${normalize(baseUri())}/catalog/`);
}
