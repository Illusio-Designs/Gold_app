// Curated set of Hugeicons offered for category icons. The `name` string is
// what gets stored in the DB (categories.icon) and resolved in the apps.
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
} from "@hugeicons/core-free-icons";

// name -> icon object. Add here to widen the picker.
export const CATEGORY_ICONS = {
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

// Ordered list for rendering the picker grid.
export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

// Fallback used when a stored name is unknown.
export const FALLBACK_CATEGORY_ICON = Diamond01Icon;

export function resolveCategoryIcon(name) {
  return (name && CATEGORY_ICONS[name]) || FALLBACK_CATEGORY_ICON;
}
