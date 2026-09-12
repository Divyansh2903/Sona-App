import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import type { CatalogCharacter } from '@/services/catalog';
import { theme, withAlpha } from '@/theme/theme';

export interface CatalogPickerProps {
  characters: CatalogCharacter[];
  selectedId: string | null;
  onSelect: (catalogId: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Horizontal carousel of catalog designs.
 *
 * Nothing is generated here — the catalog is fixed and authored offline, so this
 * is a picker in the strictest sense. Several users may choose the same design;
 * each still mints a distinct 1/1 token.
 */
export function CatalogPicker({
  characters,
  selectedId,
  onSelect,
  disabled = false,
  style,
}: CatalogPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      style={style}
    >
      {characters.map((character) => (
        <CatalogTile
          key={character.catalogId}
          character={character}
          selected={character.catalogId === selectedId}
          disabled={disabled}
          onPress={() => onSelect(character.catalogId)}
        />
      ))}
    </ScrollView>
  );
}

function CatalogTile({
  character,
  selected,
  disabled,
  onPress,
}: {
  character: CatalogCharacter;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  // The catalog host may not be reachable yet; a tile must still be pickable.
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${character.name}. ${character.tags.join(', ')}`}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && !disabled && { transform: [{ scale: theme.motion.pressScale }] },
        disabled && styles.tileDisabled,
      ]}
    >
      <View style={styles.art}>
        {failed ? (
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={44}
            color={withAlpha(theme.color.primary, 0.35)}
          />
        ) : (
          <Image
            source={{ uri: character.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
          />
        )}
      </View>

      <Text variant="labelMd" color={theme.color.text} align="center" numberOfLines={1}>
        {character.name}
      </Text>

      {/* Never colour alone: the selected tile also carries a check. */}
      {selected && (
        <View style={styles.check}>
          <MaterialCommunityIcons name="check" size={14} color={theme.color.onPrimary} />
        </View>
      )}
    </Pressable>
  );
}

const TILE_WIDTH = 132;

const styles = StyleSheet.create({
  track: {
    gap: theme.spacing.stackSm,
    paddingHorizontal: theme.layout.cardPadding,
    paddingVertical: theme.spacing.stackSm,
  },
  tile: {
    width: TILE_WIDTH,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.stackSm,
    gap: theme.spacing.stackSm,
    backgroundColor: theme.color.card,
    borderWidth: 1.5,
    borderColor: theme.color.border,
  },
  tileSelected: {
    borderColor: theme.color.accent,
    backgroundColor: withAlpha(theme.color.accent, 0.06),
  },
  tileDisabled: {
    opacity: 0.5,
  },
  art: {
    height: 112,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: withAlpha(theme.color.primary, 0.04),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.primary,
  },
});
