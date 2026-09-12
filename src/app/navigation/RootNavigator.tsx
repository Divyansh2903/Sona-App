import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { AppTabs } from '@/app/navigation/AppTabs';
import type { RootStackParamList } from '@/app/navigation/types';
import { Loader } from '@/components/Loader';
import { SeedVaultSignIn } from '@/features/auth/screens/SeedVaultSignIn';
import { Welcome } from '@/features/auth/screens/Welcome';
import { ChooseYourSona } from '@/features/mint/screens/ChooseYourSona';
import { useSession } from '@/hooks/useSession';
import { theme } from '@/theme/theme';
import { fontFamily } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Onboarding and the shell are never mounted at the same time, so no route can
 * navigate around sign-in.
 */
export function RootNavigator() {
  const status = useSession((state) => state.status);
  const restore = useSession((state) => state.restore);
  const primaryCharacterId = useSession((state) => state.session?.user.primaryCharacterId ?? null);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (status === 'restoring') {
    return <Loader fullscreen label="Restoring your session" />;
  }

  const signedIn = status === 'signed_in';
  // A signed-in wallet without a minted Sona has no identity to show in the shell,
  // so minting is the only route forward rather than a screen it can skip.
  const hasSona = primaryCharacterId !== null && primaryCharacterId !== '';

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Onboarding and mint flows draw their own headers.
          contentStyle: { backgroundColor: theme.color.background },
        }}
      >
        {signedIn ? (
          hasSona ? (
            <Stack.Screen name="AppShell" component={AppTabs} />
          ) : (
            <Stack.Screen name="ChooseYourSona" component={ChooseYourSona} />
          )
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

/** Sona is light-first only; there is no dark theme to switch to. */
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
