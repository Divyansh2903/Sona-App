/**
 * Polyfills MUST be imported before anything that touches @solana/web3.js.
 * - react-native-get-random-values: provides crypto.getRandomValues (Keypair.generate,
 *   tweetnacl nonces).
 * - buffer: web3.js and SPL Token assume a global Buffer, which RN does not ship.
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { registerRootComponent } from 'expo';

import App from '@/app/App';

registerRootComponent(App);
