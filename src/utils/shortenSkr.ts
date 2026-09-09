/**
 * Seeker ID display helpers (SONA_TECHNICAL_PLAN.md §4, §6.2).
 *
 * §6.2 wants a `.skr` Seeker ID but never specifies how it is resolved, and no
 * SNS/Seeker-ID resolver ships in this phase. The documented fallback is a
 * shortened wallet address, exposed here behind a seam that a real resolver can
 * drop into later (`resolveSeekerId` in a future `services/seekerId.ts`).
 *
 * The fallback deliberately does NOT append `.skr` — claiming a handle the user
 * does not own would be a lie in the same family as the verification copy §8 #8
 * removes.
 */

/** Ellipsis used between the head and tail of a shortened address. */
const ELLIPSIS = '…';

/**
 * Shortens a base58 wallet address for display: `HdR4oL…tdDQN`.
 * Returns the address unchanged when it is already short enough to read.
 */
export function shortenWallet(address: string, lead = 6, tail = 5): string {
  const trimmed = address.trim();
  if (trimmed.length <= lead + tail + ELLIPSIS.length) return trimmed;
  return `${trimmed.slice(0, lead)}${ELLIPSIS}${trimmed.slice(-tail)}`;
}

/**
 * The `seekerId` written to `users/{wallet}` when no Seeker ID can be resolved.
 * Swap this for the resolver's result once SNS resolution exists — nothing else
 * in the app should special-case the fallback.
 */
export function fallbackSeekerId(walletAddress: string): string {
  return shortenWallet(walletAddress);
}

/** True when a `seekerId` is a real handle rather than the shortened-wallet fallback. */
export function isResolvedSeekerId(seekerId: string): boolean {
  return seekerId.endsWith('.skr');
}
