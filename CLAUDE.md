@AGENTS.md

# Sona

Verified-by-mint slow-social app for the Solana Seeker. Android only, Expo SDK 57.

## Read before doing anything

- **`../CONTEXT.md`** (root) — project-wide context, hackathon constraints, and the
  community (not dating) positioning (§13 #14). Read it first. `../PROGRESS_TRACKER.md` is the
  committed done/remaining list; keep it current.
- **`../SONA_TECHNICAL_PLAN.md` is the single source of truth.** Architecture, data model,
  design system, phase order. Follow it exactly.
- **§13 (decision log) overrides anything above it in that document.** When they conflict,
  §13 wins. Do not "fix" code to match an earlier section that §13 has superseded.
- **`docs/progress.md`** (gitignored) — current phase, what's verified, what's next.
  Update it as you complete work.
- **`docs/CODING-STANDARDS.md`** (gitignored) — how to write the code, including the
  comment rules. **Never cite plan section numbers in source comments.**
- `../sona_app_ui/<screen>/` — `code.html` + `screen.png` per screen. These are **visual
  references, not code to port.** Re-implement natively from the design tokens.
- `../sona_app_ui/sona/DESIGN.md` — the YAML frontmatter is canonical for colors/type/spacing.

## Non-negotiable product rules

Violating any of these is a bug, even if the code compiles:

1. **All money is SOL (◎).** Never USD, never USDC. Every amount renders through `PriceSol`.
2. **DMs are encrypted before they touch Firestore.** Only `{ciphertext, nonce}` is ever
   written. The deployed Firestore rules reject plaintext bodies — do not work around it.
3. **No humanity-verification claims.** The Genesis Token check was removed (§13 #1). The
   Sona Mark means *"a minted, owned Sona"*, never "verified human" — including in
   `accessibilityLabel` strings and UI copy.
4. **No backend, no Cloud Functions, ever** (§13 #2). Firebase = Firestore + Anonymous Auth.
   If something seems to need a trusted server, it is out of scope by decision.
5. **Login is the Seeker wallet only.** No Google, no email, no password paths.
6. **No AI SDK ships in the app.** The catalog was authored offline, once.
7. **Android only.** No iOS work.

## Commands

```bash
pnpm check        # typecheck + lint — run before declaring anything done
pnpm typecheck
pnpm lint
pnpm format
pnpm start        # dev client (NOT Expo Go — MWA needs a dev build)
pnpm prebuild     # regenerates android/ ; needed after native config changes
pnpm android      # build + install on a connected device/emulator
```

`npx expo export --platform android` is the fastest way to prove everything still bundles
without needing a device.

## Code standards

- TypeScript **strict**, plus `noUncheckedIndexedAccess`. **No `any`** — use `unknown` +
  narrowing. Explicit return types on services and hooks.
- Feature-based layout. Shared UI lives only in `src/components/`. Features must not import
  each other — cross only via `services/`, `models/`, `hooks/`, `components/`.
- **Never call Firestore or web3.js from a screen.** All data access goes through a typed
  service in `src/services/`.
- Screens are thin; logic lives in hooks/services. Presentational components stay pure.
- Every screen implements **loading / empty / error** (`Loader`, `EmptyState`).
- Accessibility: 48dp targets, `accessibilityLabel` on icons, respect font scaling, never
  signal meaning by color alone.
- Imports use the `@/*` alias (Metro resolves tsconfig `paths` natively — no babel plugin).

## Environment

`.env` is gitignored; `.env.example` documents every key. `EXPO_PUBLIC_*` vars are **inlined
by Metro at build time** and must be referenced as static member expressions
(`process.env.EXPO_PUBLIC_X`) — dynamic lookup silently yields `undefined`. Everything else
is forwarded through `app.config.ts` → `extra`. **After editing `.env`, restart with
`pnpm start --clear`** — values do not hot-reload.

Nothing in `.env` is secret; it all ships in the APK. That is a documented, accepted
limitation (plan §9), not an oversight.

## Traps already hit — do not re-discover these

| Trap | Resolution |
|---|---|
| `@metaplex-foundation/mpl-token-metadata` | **Pinned to `^2.13.0`.** 3.x is Umi-based and cannot emit web3.js instructions, so it cannot build the §6.8 mint tx. Never upgrade. |
| `@solana/web3.js` crashes at runtime | Needs `react-native-get-random-values` + `buffer`. Both live in **`src/polyfills.ts`**, imported first by `index.ts`. See the `Buffer` row below for why they cannot be inlined. |
| `StyleSheet.absoluteFillObject` | Removed from RN 0.86 types. Use `StyleSheet.absoluteFill`. |
| `android.edgeToEdgeEnabled` in app.config | Not a valid SDK 57 key; edge-to-edge is default-on. |
| ESLint crashes in `eslint-plugin-react` | ESLint 10 removed an API it uses for version detection. `settings.react.version` is pinned in `eslint.config.js` to bypass it. |
| `getReactNativePersistence` missing from types | `firebase/auth` has no `react-native` export condition. Typed augmentation lives in `src/types/firebase-auth-rn.d.ts`. |
| `StatusBar backgroundColor` | Gone in SDK 57 edge-to-edge; only the icon tint applies. |
| `ReferenceError: Property 'Buffer' doesn't exist` at startup | Import declarations are **hoisted above statements**, so a `globalThis.Buffer = Buffer` assignment sitting between imports in `index.ts` ran *after* the whole app tree had been evaluated. It only ever worked by luck, until a module constructed a `PublicKey` at module scope. The assignment now lives in **`src/polyfills.ts`**, imported first as a side-effect module so it is part of the import graph. Never inline polyfills into `index.ts` again. |

## Verification expectations

Prove things rather than asserting them, and be explicit about which is which:

- Compile-verified: `pnpm check` and/or a successful `expo export`.
- Device-verified: actually ran on hardware. **Anything touching MWA, Seed Vault, or minting
  can only be device-verified** — say so plainly instead of implying it works.
- Firestore rules changes should be probed against the real project, not assumed from a
  successful `firebase deploy`.
