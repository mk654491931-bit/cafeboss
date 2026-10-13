import { configHint, supabase } from "./supabase";
import { toTurkishError } from "./errors";
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

function client() {
  if (!supabase) {
    throw new Error(configHint);
  }
  return supabase;
}

function fail(error: unknown): never {
  throw new Error(toTurkishError(error));
}

/** Reads every product, grouped by category then name. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await client()
    .from("products")
    .select(COLUMNS)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) fail(error);
  return ((data ?? []) as Row[]).map(normalize).sort(byCategoryThenName);
}

/** Inserts a new menu item and returns the created row. */
export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await client()
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
  const { data, error } = await client()
    .from("products")
    .update({ price })
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Fiyat güncellenemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}

/** Persists a product photo (uploaded file URL or data URL). */
export async function updateProductImage(
  id: string,
  imageUrl: string | null,
): Promise<void> {
  const { data, error } = await client()
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
  const { data, error } = await client()
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
  const { data, error } = await client()
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new Error("Ürün silinemedi: kayıt bulunamadı ya da yetkiniz yok.");
  }
}
