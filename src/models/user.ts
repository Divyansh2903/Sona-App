import { serverTimestamp, Timestamp, type DocumentData, type FieldValue } from 'firebase/firestore';

import { fallbackSeekerId } from '@/utils/shortenSkr';

/**
 * `users/{walletAddress}`, keyed by base58 wallet address rather than the
 * anonymous Firebase uid, which is session-scoped and changes on reinstall.
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
  uid: string;
  /** A resolved Seeker ID, or the shortened-wallet fallback. */
  seekerId: string;
  displayName: string;
  aura: Aura;
  intent: Intent;
  /** `characters/{mintAddress}` of the active Sona; null until one is minted. */
  primaryCharacterId: string | null;
  bio: string;
  interests: string[];
  prompts: ProfilePrompt[];
  /** Null while a `serverTimestamp()` sentinel is still pending resolution. */
  createdAt: Date | null;
  updatedAt: Date | null;
}

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

/** Friends-first: `dating` stays off until the user opts in. */
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
 * Any signed-in session can write a `users/*` doc, so treat the result as
 * untrusted input: every field is narrowed rather than cast.
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
