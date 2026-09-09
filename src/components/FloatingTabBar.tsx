import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/GlassPanel';
import { Text } from '@/components/Text';
import { theme } from '@/theme/theme';

/** The three top-level destinations. */
export type TabKey = 'discover' | 'threads' | 'you';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export const TABS: readonly TabDef[] = [
  { key: 'discover', label: 'Discover', icon: 'compass-outline' },
  { key: 'threads', label: 'Threads', icon: 'message-text-outline' },
  { key: 'you', label: 'You', icon: 'account-outline' },
] as const;

export interface FloatingTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

/**
 * A glass pill docked 24px from the bottom; the active tab gets a gradient dot
 * beneath its icon.
 *
 * Hidden on onboarding, mint, chat, and modal flows — the navigator decides that,
 * not this component.
 */
export function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { bottom: theme.layout.floatingNavOffset + insets.bottom }]}
      pointerEvents="box-none"
    >
      <GlassPanel radius={theme.radius.full} style={styles.pill}>
        <View style={styles.row}>
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabPress(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                style={styles.tab}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={24}
                  color={active ? theme.color.primary : theme.color.accent}
                />
                <Text
                  variant="labelSm"
                  color={active ? theme.color.primary : theme.color.textMuted}
                >
                  {tab.label}
                </Text>
                {/* A shape, not just a color shift. */}
                <View style={styles.dotSlot}>
                  {active && (
                    <LinearGradient
                      colors={theme.gradient.primary}
                      start={theme.gradientDirection.start}
                      end={theme.gradientDirection.end}
                      style={styles.dot}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    // Keeps the bar within the 600px social track on wide displays.
    maxWidth: theme.layout.socialTrackMaxWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.stackSm,
    paddingVertical: 10,
  },
  tab: {
    minWidth: 88,
    minHeight: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: theme.spacing.stackMd,
  },
  dotSlot: {
    height: 4,
    marginTop: 2,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
