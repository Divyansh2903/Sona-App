import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * One stack, two halves: onboarding exists only while signed out, the shell only
 * while signed in. `RootNavigator` swaps the screen set rather than navigating
 * between them, so no route can reach the shell unauthenticated.
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
