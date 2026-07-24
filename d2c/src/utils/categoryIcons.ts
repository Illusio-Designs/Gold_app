// Resolves a category's stored icon name (e.g. "Diamond01Icon") to a Hugeicons
// object for rendering. Mirrors the curated set offered in the dashboard picker.
import {
  Diamond01Icon,
  DiamondIcon,
  GemIcon,
  NecklaceIcon,
  CrownIcon,
  Crown02Icon,
  SparklesIcon,
  StarIcon,
  StarsIcon,
  FavouriteIcon,
  HeartIcon,
  FlowerIcon,
  RoseIcon,
  LeafIcon,
  GiftIcon,
  Watch01Icon,
  PackageIcon,
  ShoppingBag03Icon,
  ShoppingBasket01Icon,
} from '@hugeicons/core-free-icons';

export const CATEGORY_ICONS: Record<string, any> = {
  Diamond01Icon,
  DiamondIcon,
  GemIcon,
  NecklaceIcon,
  CrownIcon,
  Crown02Icon,
  SparklesIcon,
  StarIcon,
  StarsIcon,
  FavouriteIcon,
  HeartIcon,
  FlowerIcon,
  RoseIcon,
  LeafIcon,
  GiftIcon,
  Watch01Icon,
  PackageIcon,
  ShoppingBag03Icon,
  ShoppingBasket01Icon,
};

export const FALLBACK_CATEGORY_ICON = Diamond01Icon;

export function resolveCategoryIcon(name?: string | null) {
  return (name && CATEGORY_ICONS[name]) || FALLBACK_CATEGORY_ICON;
}
