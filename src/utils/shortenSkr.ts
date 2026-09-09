/**
 * Seeker ID display.
 *
 * No SNS resolver ships yet, so `fallbackSeekerId` returns a shortened wallet
 * address. It deliberately does NOT append `.skr` — claiming a handle the user
 * does not own would be a lie of the same kind as the verification copy this app
 * exists to avoid. Swap the fallback for a resolver's result when one lands;
 * nothing else should special-case it.
 */

const ELLIPSIS = '…';

/** `HdR4oL…tdDQN`. Returned unchanged when already short enough to read. */
export function shortenWallet(address: string, lead = 6, tail = 5): string {
  const trimmed = address.trim();
  if (trimmed.length <= lead + tail + ELLIPSIS.length) return trimmed;
  return `${trimmed.slice(0, lead)}${ELLIPSIS}${trimmed.slice(-tail)}`;
}

export function fallbackSeekerId(walletAddress: string): string {
  return shortenWallet(walletAddress);
}

/** True when a `seekerId` is a real handle rather than the shortened-wallet fallback. */
export function isResolvedSeekerId(seekerId: string): boolean {
  return seekerId.endsWith('.skr');
}
