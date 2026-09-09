import { useFonts } from 'expo-font';

/**
 * Font loading (SONA_TECHNICAL_PLAN.md §5.1): Bricolage Grotesque 700/800 for
 * headlines, Inter 400/600 for body and labels.
 *
 * The TTFs are vendored into `assets/fonts/` from the `@expo-google-fonts/*`
 * packages so loading is deterministic and works in any client without a prebuild.
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
