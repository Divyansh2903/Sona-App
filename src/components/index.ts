/**
 * Shared, presentational components.
 * Feature code imports from here; nothing in this folder may import from `features/`.
 *
 * Not yet built: CatalogPicker — it depends on the character catalog manifest and
 * is built alongside `services/catalog.ts`.
 */
export { AuraBadge, type AuraBadgeProps } from '@/components/AuraBadge';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from '@/components/Button';
export { Card, type CardProps } from '@/components/Card';
export { CharacterCanvas, type CharacterCanvasProps } from '@/components/CharacterCanvas';
export { ChatBubble, type ChatBubbleProps } from '@/components/ChatBubble';
export { Chip, type ChipProps } from '@/components/Chip';
export { EmptyState, type EmptyStateProps } from '@/components/EmptyState';
export {
  FloatingTabBar,
  TABS,
  type FloatingTabBarProps,
  type TabKey,
} from '@/components/FloatingTabBar';
export { GlassPanel, type GlassPanelProps } from '@/components/GlassPanel';
export { Input, type InputProps } from '@/components/Input';
export { Loader, type LoaderProps } from '@/components/Loader';
export { PriceSol, type PriceSolProps } from '@/components/PriceSol';
export { Sheet, type SheetProps } from '@/components/Sheet';
export { SonaMark, type SonaMarkProps, type SonaMarkSize } from '@/components/SonaMark';
export { Text, type TextProps } from '@/components/Text';
