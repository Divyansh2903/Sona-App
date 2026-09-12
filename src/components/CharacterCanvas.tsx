import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { theme, withAlpha } from '@/theme/theme';

export interface CharacterCanvasProps {
  /** Catalog thumbnail or the minted NFT's image. */
  imageUri?: string;
  /** Shows the "Owned · on-chain" chip. True only once the NFT is confirmed. */
  owned?: boolean;
  /** Character/Sona name overlaid at the bottom. */
  name?: string;
  seekerId?: string;
  /**
   * Fixed height. Omit for a square canvas, which is the default and what catalog
   * art is authored for — a square image in a square frame fills it exactly, so
   * there is no crop and no letterboxing against the background.
   */
  height?: number;
  style?: ViewStyle;
}

/**
 * A catalog character on a soft pedestal with the on-chain "owned" mark. Shows a
 * skeleton while the image loads.
 */
export function CharacterCanvas({
  imageUri,
  owned = false,
  name,
  seekerId,
  height,
  style,
}: CharacterCanvasProps) {
  const [loading, setLoading] = useState(imageUri !== undefined);
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.container, height === undefined ? styles.square : { height }, style]}>
      {/* Soft pedestal glow behind the character. */}
      <LinearGradient
        colors={[withAlpha(theme.color.primary, 0.06), withAlpha(theme.color.accent, 0.1)]}
        start={theme.gradientDirection.start}
        end={theme.gradientDirection.end}
        style={StyleSheet.absoluteFill}
      />

      {imageUri !== undefined && !failed && (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          // Square art in a square frame, so this fills edge to edge without
          // cropping. `cover` rather than `contain` so a render that is a pixel
          // off square still fills rather than showing a seam.
          resizeMode="cover"
          accessibilityLabel={name !== undefined ? `${name}'s Sona character` : 'Sona character'}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}

      {(loading || failed || imageUri === undefined) && (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name={failed ? 'image-off-outline' : 'account-circle-outline'}
            size={48}
            color={withAlpha(theme.color.primary, 0.25)}
          />
          {failed && (
            <Text variant="labelSm" color={theme.color.textMuted}>
              Couldn&apos;t load character
            </Text>
          )}
        </View>
      )}

      {owned && (
        <View style={styles.ownedChip}>
          <MaterialCommunityIcons name="link-variant" size={12} color={theme.color.primary} />
          <Text variant="labelSm" color={theme.color.primary}>
            Owned · on-chain
          </Text>
        </View>
      )}

      {(name !== undefined || seekerId !== undefined) && (
        <>
          {/* Scrim so the name stays legible over any artwork. */}
          <LinearGradient
            colors={['transparent', withAlpha('#000000', 0.45)]}
            style={styles.scrim}
          />
          <View style={styles.caption}>
            {name !== undefined && (
              <Text variant="headlineMd" color={theme.color.onPrimary}>
                {name}
              </Text>
            )}
            {seekerId !== undefined && (
              <Text variant="labelMd" color={withAlpha('#FFFFFF', 0.85)}>
                {seekerId}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    aspectRatio: 1,
  },
  container: {
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceMuted,
    ...theme.shadow.card,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.stackSm,
  },
  ownedChip: {
    position: 'absolute',
    top: theme.spacing.gutter,
    right: theme.spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: withAlpha('#FFFFFF', 0.8),
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  caption: {
    position: 'absolute',
    left: theme.layout.cardPadding,
    bottom: theme.layout.cardPadding,
    gap: 2,
  },
});
