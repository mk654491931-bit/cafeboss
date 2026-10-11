import {
  Cake,
  Coffee,
  Croissant,
  CupSoda,
  Dices,
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
    case "Kahvaltılıklar":
      return Croissant;
    case "Okey Salonu":
      return Dices;
    case "Sıcak Kahveler":
    default:
      return Coffee;
  }
}
