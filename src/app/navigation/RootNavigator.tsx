import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { AppTabs } from '@/app/navigation/AppTabs';
import type { RootStackParamList } from '@/app/navigation/types';
import { Loader } from '@/components/Loader';
import { SeedVaultSignIn } from '@/features/auth/screens/SeedVaultSignIn';
import { Welcome } from '@/features/auth/screens/Welcome';
import { useSession } from '@/hooks/useSession';
import { theme } from '@/theme/theme';
import { fontFamily } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth gating (SONA_TECHNICAL_PLAN.md §6.1).
 *
 * The onboarding screens and the app shell are never mounted at the same time,
 * so there is no route that can navigate around sign-in. Phase 3 adds
 * `ChooseYourSona` to the signed-out half for first-run minting.
 */
export function RootNavigator() {
  const status = useSession((state) => state.status);
  const restore = useSession((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (status === 'restoring') {
    return <Loader fullscreen label="Restoring your session" />;
  }

  const signedIn = status === 'signed_in';

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Onboarding and mint use custom headers; the shell hides the bar (§6.1).
          contentStyle: { backgroundColor: theme.color.background },
        }}
      >
        {signedIn ? (
          <Stack.Screen name="AppShell" component={AppTabs} />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="SeedVaultSignIn" component={SeedVaultSignIn} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/** Sona is light-first only — there is no dark theme to switch to (§5.1). */
const navigationTheme: NavigationTheme = {
  dark: false,
  colors: {
    primary: theme.color.primary,
    background: theme.color.background,
    card: theme.color.card,
    text: theme.color.text,
    border: theme.color.border,
    notification: theme.color.secondary,
  },
  fonts: {
    regular: { fontFamily: fontFamily.body, fontWeight: '400' },
    medium: { fontFamily: fontFamily.label, fontWeight: '600' },
    bold: { fontFamily: fontFamily.headline, fontWeight: '700' },
    heavy: { fontFamily: fontFamily.headlineBold, fontWeight: '800' },
  },
};
