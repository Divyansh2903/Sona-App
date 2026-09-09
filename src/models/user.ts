import { serverTimestamp, Timestamp, type DocumentData, type FieldValue } from 'firebase/firestore';

import { fallbackSeekerId } from '@/utils/shortenSkr';

/**
 * `users/{walletAddress}` (SONA_TECHNICAL_PLAN.md §4).
 *
 * Documents are keyed by the base58 **wallet address**, not by the anonymous
 * Firebase uid — the uid is session-only and is stored on the doc purely so the
 * Firestore rules can tell which session claimed the wallet.
 *
 * PERMANENT LIMITATION (§9): the rules cannot verify wallet ownership, so the
 * first write to `users/{wallet}` claims it. Reading code must never treat
 * `uid` as proof of anything.
 */

export const USERS_COLLECTION = 'users';

export interface Aura {
  level: number;
  points: number;
}

export interface Intent {
  friends: boolean;
  dating: boolean;
}

export interface ProfilePrompt {
  q: string;
  a: string;
}

export interface UserDoc {
  walletAddress: string;
  /** Anonymous auth uid of the session that claimed this wallet. */
  uid: string;
  /** Resolved Seeker ID, or the shortened-wallet fallback (§6.2). */
  seekerId: string;
  displayName: string;
  aura: Aura;
  intent: Intent;
  /** `characters/{mintAddress}` of the active Sona; null until Phase 3's mint. */
  primaryCharacterId: string | null;
  bio: string;
  interests: string[];
  prompts: ProfilePrompt[];
  /** Null while a `serverTimestamp()` sentinel is still pending resolution. */
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** The write payload for a brand-new user, before the server stamps the times. */
export interface NewUserPayload {
  walletAddress: string;
  uid: string;
  seekerId: string;
  displayName: string;
  aura: Aura;
  intent: Intent;
  primaryCharacterId: string | null;
  bio: string;
  interests: string[];
  prompts: ProfilePrompt[];
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

/**
 * Defaults for a first sign-in. Friends-first: `dating` stays off until the user
 * opts in from Your Identity (§11 Phase 6).
 */
export function buildNewUserPayload(walletAddress: string, uid: string): NewUserPayload {
  const seekerId = fallbackSeekerId(walletAddress);
  return {
    walletAddress,
    uid,
    seekerId,
    displayName: seekerId,
    aura: { level: 1, points: 0 },
    intent: { friends: true, dating: false },
    primaryCharacterId: null,
    bio: '',
    interests: [],
    prompts: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Parses a Firestore snapshot into a `UserDoc`, tolerating partial/legacy docs.
 *
 * Firestore is untrusted input as far as the client is concerned (any signed-in
 * session can create a `users/*` doc, §9), so every field is narrowed rather
 * than cast.
 */
export function parseUserDoc(walletAddress: string, data: DocumentData): UserDoc {
  return {
    walletAddress: asString(data.walletAddress) ?? walletAddress,
    uid: asString(data.uid) ?? '',
    seekerId: asString(data.seekerId) ?? fallbackSeekerId(walletAddress),
    displayName: asString(data.displayName) ?? fallbackSeekerId(walletAddress),
    aura: asAura(data.aura),
    intent: asIntent(data.intent),
    primaryCharacterId: asString(data.primaryCharacterId) ?? null,
    bio: asString(data.bio) ?? '',
    interests: asStringArray(data.interests),
    prompts: asPrompts(data.prompts),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asAura(value: unknown): Aura {
  const raw = asRecord(value);
  return { level: asNumber(raw.level, 1), points: asNumber(raw.points, 0) };
}

function asIntent(value: unknown): Intent {
  const raw = asRecord(value);
  return { friends: asBoolean(raw.friends, true), dating: asBoolean(raw.dating, false) };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function asPrompts(value: unknown): ProfilePrompt[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ProfilePrompt[] => {
    const raw = asRecord(entry);
    const q = asString(raw.q);
    const a = asString(raw.a);
    return q !== null && a !== null ? [{ q, a }] : [];
  });
}

function asDate(value: unknown): Date | null {
  // `serverTimestamp()` reads back as null until the server resolves it.
  return value instanceof Timestamp ? value.toDate() : null;
}
