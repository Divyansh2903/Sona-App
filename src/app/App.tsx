import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { ComponentGallery } from '@/dev/ComponentGallery';
import { useAppFonts } from '@/theme/fonts';
import { theme } from '@/theme/theme';

/**
 * Root providers (SONA_TECHNICAL_PLAN.md §3).
 *
 * Phase 0/1 renders the component gallery. Phase 2 replaces the gallery with
 * `RootNavigator` (onboarding stack vs. app shell, auth-gated) — see §6.1.
 */
export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Firestore is an index/cache; a short stale window keeps reads cheap.
            staleTime: 30_000,
            retry: 2,
          },
        },
      }),
    [],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/* Edge-to-edge on SDK 57: the bar is translucent, so only the icon tint applies. */}
          <StatusBar style="dark" />
          <View style={styles.screen}>
            <AppContent fontsLoaded={fontsLoaded} fontError={fontError} />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent({ fontsLoaded, fontError }: { fontsLoaded: boolean; fontError: Error | null }) {
  // Fonts carry the brand; block first render until they resolve (§5.1).
  if (fontError !== null) {
    return <EmptyState tone="error" title="Couldn't load fonts" description={fontError.message} />;
  }

  if (!fontsLoaded) {
    return <Loader fullscreen />;
  }

  return <ComponentGallery />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
});
