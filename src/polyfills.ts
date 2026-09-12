/**
 * Runtime polyfills that must exist before any module touching `@solana/web3.js`
 * is evaluated.
 *
 * These live in their own side-effect module on purpose. Import declarations are
 * hoisted, so a bare assignment sitting between imports in the entry file runs
 * AFTER every one of those imports has already been evaluated — including the app
 * tree. Putting the assignment inside a module makes it part of the import graph,
 * so it is guaranteed to run before anything imported after it.
 *
 * - `react-native-get-random-values` supplies `crypto.getRandomValues`, needed by
 *   `Keypair.generate()` and tweetnacl nonces.
 * - `buffer` supplies the global `Buffer` that web3.js and SPL Token assume and
 *   React Native does not ship.
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
