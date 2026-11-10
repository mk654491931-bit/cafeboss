import { CATEGORIES, type Product } from "./types";

export const ALL_CATEGORIES = "Tümü";

/**
 * Products without an uploaded photo still look like a real menu in the POS.
 * These paths live in public/menu and are also used by the public menu.
 */
export const CATEGORY_PHOTOS: Record<string, string> = {
  "Sıcak Kahveler": "/menu/latte.jpg",
  "Soğuk Kahveler": "/menu/ice-latte.jpg",
  Çaylar: "/menu/cay.jpg",
  Tatlılar: "/menu/cheesecake.jpg",
  Nargile: "/menu/nargile.jpg",
  Yiyecekler: "/menu/kahvalti.jpg",
  "Soğuk İçecekler": "/menu/limonata.jpg",
};

const categoryOrder = new Map<string, number>(
  CATEGORIES.map((category, index) => [category, index]),
);

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr");
}

export function compareCategories(a: string, b: string): number {
  const aIndex = categoryOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
  const bIndex = categoryOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
  if (aIndex !== bIndex) return aIndex - bIndex;
  return a.localeCompare(b, "tr");
}

export function sortCatalog(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const byCategory = compareCategories(a.category, b.category);
    return byCategory !== 0
      ? byCategory
      : a.name.localeCompare(b.name, "tr");
  });
}

/** Categories that actually contain a product, in the menu's canonical order. */
export function catalogCategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((product) => product.category))).sort(
    compareCategories,
  );
}

export function filterCatalog(
  products: Product[],
  category: string,
  query: string,
): Product[] {
  const search = normalize(query.trim());

  return products.filter((product) => {
    if (category !== ALL_CATEGORIES && product.category !== category) {
      return false;
    }
    if (!search) return true;

    return normalize(
      `${product.name} ${product.category} ${product.description ?? ""}`,
    ).includes(search);
  });
}

export interface CatalogGroup {
  category: string;
  products: Product[];
}

export function groupCatalog(products: Product[]): CatalogGroup[] {
  const sorted = sortCatalog(products);
  const grouped = new Map<string, Product[]>();

  for (const product of sorted) {
    const list = grouped.get(product.category);
    if (list) list.push(product);
    else grouped.set(product.category, [product]);
  }

  return catalogCategories(sorted).map((category) => ({
    category,
    products: grouped.get(category) ?? [],
  }));
}

/** Uploaded photo first, then a representative category photo. */
export function productPhotoSources(product: Product): string[] {
  return Array.from(
    new Set(
      [product.image_url, CATEGORY_PHOTOS[product.category]].filter(
        (source): source is string => Boolean(source),
      ),
    ),
  );
}
