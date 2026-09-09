import type { Persistence } from 'firebase/auth';

/**
 * `firebase/auth` is `export * from '@firebase/auth'`. Under Metro, the `react-native`
 * export condition resolves that to `@firebase/auth/dist/rn`, which exports
 * `getReactNativePersistence`. TypeScript, however, follows the umbrella package's
 * `types` entry (the *web* surface), where the symbol is absent.
 *
 * The top-level `import` above makes this file a module, so the block below
 * AUGMENTS `firebase/auth` rather than replacing it with an ambient declaration.
 *
 * Remove this if firebase ever adds a `react-native` condition to its own `exports`.
 */
declare module 'firebase/auth' {
  /** Minimal shape of the AsyncStorage-compatible store the RN build expects. */
  export interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
