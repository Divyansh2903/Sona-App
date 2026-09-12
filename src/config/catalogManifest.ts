/**
 * The curated character catalog.
 *
 * Authored once, offline (plan §6.6) — no AI ships in the app and nothing here is
 * generated at runtime. The user PICKS one of these; the chosen entry's
 * `metadataUri` goes straight into the mint's metadata instruction.
 *
 * Asset paths are relative to `EXPO_PUBLIC_CATALOG_BASE_URI` so the hostname can
 * change without touching this file. Every design lives at
 * `{base}/catalog/{catalogId}/image.png` + `/metadata.json`.
 *
 * Shared artwork across users is intended: each mint is still a unique 1/1 token.
 */

/**
 * The vibe filter's full vocabulary. Deliberately short: this is a filter over
 * twelve designs, and a wrapping wall of tags pushes the picker itself off-screen.
 * Every tag on an entry must come from this list.
 */
export const CATALOG_VIBES = ['calm', 'bold', 'playful', 'curious', 'grounded', 'bright'] as const;

export type CatalogVibe = (typeof CATALOG_VIBES)[number];

export interface CatalogEntry {
  catalogId: string;
  /** The design's display name in the picker — not the user's Sona name. */
  name: string;
  /** Drives the vibe filter. */
  tags: CatalogVibe[];
}

export const CATALOG_ENTRIES: readonly CatalogEntry[] = [
  { catalogId: 'aurora', name: 'Aurora', tags: ['calm', 'bright'] },
  { catalogId: 'ember', name: 'Ember', tags: ['bold', 'bright'] },
  { catalogId: 'juniper', name: 'Juniper', tags: ['grounded', 'calm'] },
  { catalogId: 'koda', name: 'Koda', tags: ['playful', 'bold'] },
  { catalogId: 'lumen', name: 'Lumen', tags: ['bright', 'curious'] },
] as const;

/*
 * Five while the pipeline is proven end to end. The remaining seven designs —
 * mira, nova, onyx, pip, sage, tide, wren — are authored the same way; their
 * prompts live in `CATALOG_PROMPTS.md` at the project root.
 *
 * Only list a design here once its image and metadata are actually uploaded: an
 * entry with no art behind it renders as a placeholder tile the user can still
 * pick and mint, which would bake a dead URI into a real NFT.
 */
