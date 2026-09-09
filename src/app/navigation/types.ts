import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Typed routes (SONA_TECHNICAL_PLAN.md §3, §6.1).
 *
 * One stack, two halves: the onboarding screens exist only while signed out,
 * the shell only while signed in — `RootNavigator` swaps the screen set rather
 * than navigating between them, so there is no back-door out of auth.
 *
 * Phase 3 inserts `ChooseYourSona` into the onboarding half for first-run, and
 * Phases 4–6 add the stack-pushed screens (ProfileDetails, ChatThread, …).
 */
export type RootStackParamList = {
  Welcome: undefined;
  SeedVaultSignIn: undefined;
  AppShell: undefined;
};

export type RootScreenProps<Route extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Route
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Gives `useNavigation()` the right param list app-wide. The empty body is
    // the point — this is declaration merging, not a type alias.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
