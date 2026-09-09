import { useFonts } from 'expo-font';

/**
 * TTFs are vendored into `assets/fonts/` rather than loaded from the
 * `@expo-google-fonts/*` packages, so this works in any client without a prebuild.
 * The family keys must match `tokens.fontFamily`.
 */
export function useAppFonts(): [loaded: boolean, error: Error | null] {
  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold: require('../../assets/fonts/BricolageGrotesque_700Bold.ttf'),
    BricolageGrotesque_800ExtraBold: require('../../assets/fonts/BricolageGrotesque_800ExtraBold.ttf'),
    Inter_400Regular: require('../../assets/fonts/Inter_400Regular.ttf'),
    Inter_600SemiBold: require('../../assets/fonts/Inter_600SemiBold.ttf'),
  });

  return [loaded, error];
}
