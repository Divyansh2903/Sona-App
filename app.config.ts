import type { ExpoConfig } from 'expo/config';

/**
 * Sona — Expo config. Android only (Solana Seeker); no iOS or web targets.
 *
 * Env handling (see SONA_TECHNICAL_PLAN.md §7 and §9):
 *  - `EXPO_PUBLIC_*` vars are inlined into the bundle by Metro and read via `process.env`.
 *  - The remaining vars are surfaced through `extra` below so the client can read them via
 *    `expo-constants`. There is no backend, so these MUST be client-readable. They are
 *    therefore NOT secret — this is the tradeoff documented in §9.
 */
const config: ExpoConfig = {
  name: 'Sona',
  slug: 'sona',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'sona',
  userInterfaceStyle: 'light',
  platforms: ['android'],
  // Matches theme token `surface` (#fff7f9) so the cold-start frame is on-brand.
  backgroundColor: '#fff7f9',
  android: {
    package: 'com.sona.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
    },
    // SDK 57 is edge-to-edge by default on Android; no opt-in flag needed.
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-dev-client',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#fff7f9',
      },
    ],
  ],
  extra: {
    treasuryWallet: process.env.TREASURY_WALLET ?? '',
    messageEncryptionKey: process.env.MESSAGE_ENCRYPTION_KEY ?? '',
  },
};

export default config;
