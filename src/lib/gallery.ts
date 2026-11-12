import { authenticatedClient, supabase } from "./supabase";
import { readLocalValue, writeLocalValue } from "./localStore";

export interface GalleryImage {
  id: string;
  src: string;
  caption: string;
  alt: string;
}

const STORAGE_KEY = "boss-cafe-gallery";
const CONTENT_KEY = "gallery";

/** Admin hiç fotoğraf yüklemediyse gösterilen başlangıç kareleri. */
export const DEFAULT_GALLERY: GalleryImage[] = [
  {
    id: "default-interior",
    src: "/photos/gallery-interior.jpg",
    caption: "İç Mekân",
    alt: "Ahşap masalı sıcak kafe iç mekânı",
  },
  {
    id: "default-latte",
    src: "/photos/gallery-latte.jpg",
    caption: "İmza Latte",
    alt: "Latte art ile süslenmiş fincan",
  },
  {
    id: "default-snack",
    src: "/photos/gallery-snack.jpg",
    caption: "Atıştırmalıklar",
    alt: "Kahve yanında taze sandviç",
  },
  {
    id: "default-filter",
    src: "/photos/gallery-filter.jpg",
    caption: "Filtre Demleme",
    alt: "Cam bardakta filtre kahve",
  },
  {
    id: "default-barista",
    src: "/photos/gallery-barista.jpg",
    caption: "Barista Tezgâhı",
    alt: "Kafe barında kahve ekipmanları",
  },
  {
    id: "default-pastry",
    src: "/photos/gallery-pastry.jpg",
    caption: "Tatlı Vitrini",
    alt: "Taze pişmiş hamur işleri",
  },
];

export function createGalleryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isGalleryImage(value: unknown): value is GalleryImage {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.src === "string" &&
    typeof row.caption === "string" &&
    typeof row.alt === "string"
  );
}

async function readLocal(): Promise<GalleryImage[] | null> {
  const parsed = await readLocalValue<unknown>(STORAGE_KEY);
  if (!Array.isArray(parsed)) return null;
  const rows = parsed.filter(isGalleryImage);
  return rows.length > 0 ? rows : null;
}

/**
 * Galeriyi okur. Supabase yapılandırılmışsa `site_content` tablosundan,
 * aksi hâlde (ya da tablo yoksa) tarayıcıdaki yerel kopyadan gelir.
 */
export async function fetchGallery(): Promise<GalleryImage[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", CONTENT_KEY)
        .maybeSingle();

      if (error) throw error;

      const value: unknown = data?.value;
      const rows = Array.isArray(value) ? value.filter(isGalleryImage) : [];
      if (rows.length > 0) return rows;
      return DEFAULT_GALLERY;
    } catch {
      // Supabase erişilemezse yerel kayda düş.
    }
  }

  return (await readLocal()) ?? DEFAULT_GALLERY;
}

/**
 * Galeriyi kaydeder. Her durumda tarayıcıya yazar (anında görünürlük için),
 * Supabase varsa `site_content` kaydını da günceller.
 */
export async function saveGallery(images: GalleryImage[]): Promise<void> {
  await writeLocalValue(STORAGE_KEY, images);

  if (!supabase) return;

  const db = await authenticatedClient();
  const { error } = await db
    .from("site_content")
    .upsert({ key: CONTENT_KEY, value: images }, { onConflict: "key" });

  if (error) {
    throw new Error(
      "Galeri sunucuya kaydedilemedi. Supabase şemasının (supabase/schema.sql) çalıştırıldığından emin olun.",
    );
  }
}
