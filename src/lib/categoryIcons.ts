import {
  Cake,
  Coffee,
  Croissant,
  CupSoda,
  GlassWater,
  Wind,
  type LucideIcon,
} from "lucide-react";

/** Representative icon for a menu category (used by image placeholders). */
export function categoryIcon(category: string): LucideIcon {
  switch (category) {
    case "Soğuk Kahveler":
      return CupSoda;
    case "Çaylar":
      return GlassWater;
    case "Tatlılar":
      return Cake;
    case "Nargile":
      return Wind;
    case "Yiyecekler":
      return Croissant;
    case "Soğuk İçecekler":
      return CupSoda;
    case "Sıcak Kahveler":
    default:
      return Coffee;
  }
}
