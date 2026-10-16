export const CATEGORIES = [
  "Sıcak Kahveler",
  "Soğuk Kahveler",
  "Çaylar",
  "Tatlılar",
  "Nargile",
  "Yiyecekler",
  "Soğuk İçecekler",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
}
