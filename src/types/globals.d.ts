import type { Buffer as NodeBuffer } from 'buffer';

/**
 * `@solana/web3.js` and `@solana/spl-token` assume a global `Buffer`, which React
 * Native does not ship. `index.ts` installs the `buffer` polyfill at startup; this
 * declares it so the rest of the app sees a typed global.
 */
declare global {
  var Buffer: typeof NodeBuffer;
}

export {};
