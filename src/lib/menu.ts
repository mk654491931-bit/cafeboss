import { authenticatedClient, supabase } from "./supabase";
import { toTurkishError } from "./errors";
import { createKasaId, DEMO_MENU } from "./kasa";
import { readLocalValue, writeLocalValue } from "./localStore";
import type { Product, ProductInput } from "./types";

const COLUMNS =
  "id, name, category, price, description, image_url, is_available, created_at";

interface Row {
  id: string;
  name: string;
  category: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
}

function normalize(row: Row): Product {
  return { ...row, price: Number(row.price) };
}

function byName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, "tr");
}

function byCategoryThenName(a: Product, b: Product): number {
  const byCategory = a.category.localeCompare(b.category, "tr");
  return byCategory !== 0 ? byCategory : byName(a, b);
}

function fail(error: unknown): never {
  throw new Error(toTurkishError(error));
}

/*
 * Supabase anahtarları yoksa (önizleme ya da çevrimdışı kurulum) menü boş
 * kalmasın: örnek menü yerel olarak tohumlanır ve yönetici düzenlemeleri bu
 * cihazda saklanır. Böylece site hiçbir cihazda hata ekranı göstermez.
 */
const LOCAL_MENU_KEY = "boss-cafe-menu-v1";

function isLocalProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.category === "string" &&
    typeof row.price === "number" &&
    Number.isFinite(row.price) &&
    (row.description === null || typeof row.description === "string") &&
    (row.image_url === null || typeof row.image_url === "string") &&
    typeof row.is_available === "boolean"
  );
}

async function readLocalMenu(): Promise<Product[] | null> {
  const parsed = await readLocalValue<unknown>(LOCAL_MENU_KEY);
  if (!Array.isArray(parsed)) return null;
  const rows = parsed.filter(isLocalProduct);
  // Kayıt bozulmuşsa boş menü göstermek yerine yedeğe/örnek menüye dön.
  if (rows.length === 0 && parsed.length > 0) return null;
  return rows;
}

async function writeLocalMenu(products: Product[]): Promise<void> {
  await writeLocalValue(LOCAL_MENU_KEY, products);
}

async function localMenu(): Promise<Product[]> {
  const stored = await readLocalMenu();
  if (stored) return stored;

  const seeded = [...DEMO_MENU];
  try {
    await writeLocalMenu(seeded);
  } catch {
    // Depolama yazamasa bile menü bu oturumda görünsün.
  }
  return seeded;
}

async function updateLocalProduct(
  id: string,
  patch: Partial<Product>,
): Promise<void> {
  const current = await localMenu();
  if (!current.some((product) => product.id === id)) {
    throw new Error("Kayıt bulunamadı. Menüyü yenileyip tekrar deneyin.");
  }
  await writeLocalMenu(
    current.map((product) =>
      product.id === id ? { ...product, ...patch } : product,
    ),
  );
}

/** Reads every product, grouped by category then name. */
export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) return [...(await localMenu())].sort(byCategoryThenName);

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) fail(error);
  return ((data ?? []) as Row[]).map(normalize).sort(byCategoryThenName);
}

/** Inserts a new menu item and returns the created row. */
export async function createProduct(input: ProductInput): Promise<Product> {
  if (!supabase) {
    const product: Product = {
      id: createKasaId(),
      name: input.name,
      category: input.category,
      price: input.price,
      description: input.description || null,
      image_url: input.image_url || null,
      is_available: true,
    };
    await writeLocalMenu([...(await localMenu()), product]);
    return product;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .insert({
      name: input.name,
      category: input.category,
      price: input.price,
      description: input.description || null,
      image_url: input.image_url || null,
      is_available: true,
    })
    .select(COLUMNS)
    .single();

  if (error) fail(error);
  return normalize(data as Row);
}

/** Persists a price change. Throws when the row was not writable. */
export async function updateProductPrice(
  id: string,
  price: number,
): Promise<void> {
  if (!supabase) {
    await updateLocalProduct(id, { price });
    return;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .update({ price })
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Fiyat güncellenemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}

/** Persists a category change. Throws when the row was not writable. */
export async function updateProductCategory(
  id: string,
  category: string,
): Promise<void> {
  if (!supabase) {
    await updateLocalProduct(id, { category });
    return;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .update({ category })
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error(
      "Kategori güncellenemedi: kayıt bulunamadı ya da yetkiniz yok.",
    );
  }
}

/** Persists a product photo (uploaded file URL or data URL). */
export async function updateProductImage(
  id: string,
  imageUrl: string | null,
): Promise<void> {
  if (!supabase) {
    await updateLocalProduct(id, { image_url: imageUrl });
    return;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Fotoğraf güncellenemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}

/** Flips the Aktif / Tükendi state. */
export async function updateProductAvailability(
  id: string,
  isAvailable: boolean,
): Promise<void> {
  if (!supabase) {
    await updateLocalProduct(id, { is_available: isAvailable });
    return;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Durum güncellenemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}

/** Removes a product permanently. */
export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    const current = await localMenu();
    if (!current.some((product) => product.id === id)) {
      throw new Error("Ürün silinemedi: kayıt bulunamadı.");
    }
    await writeLocalMenu(current.filter((product) => product.id !== id));
    return;
  }

  const db = await authenticatedClient();
  const { data, error } = await db
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Ürün silinemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}
