import { supabase } from "./supabase";

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
    src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
    caption: "İç Mekân",
    alt: "Ahşap masalı sıcak kafe iç mekânı",
  },
  {
    id: "default-latte",
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    caption: "İmza Latte",
    alt: "Latte art ile süslenmiş fincan",
  },
  {
    id: "default-snack",
    src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
    caption: "Atıştırmalıklar",
    alt: "Kahve yanında taze sandviç",
  },
  {
    id: "default-filter",
    src: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
    caption: "Filtre Demleme",
    alt: "Cam bardakta filtre kahve",
  },
  {
    id: "default-barista",
    src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
    caption: "Barista Tezgâhı",
    alt: "Kafe barında kahve ekipmanları",
  },
  {
    id: "default-pastry",
    src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
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

function readLocal(): GalleryImage[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const rows = parsed.filter(isGalleryImage);
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

function writeLocal(images: GalleryImage[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    // Kalıcılık kritik değil; devam et.
  }
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

  return readLocal() ?? DEFAULT_GALLERY;
}

/**
 * Galeriyi kaydeder. Her durumda tarayıcıya yazar (anında görünürlük için),
 * Supabase varsa `site_content` kaydını da günceller.
 */
export async function saveGallery(images: GalleryImage[]): Promise<void> {
  writeLocal(images);

  if (!supabase) return;

  const { error } = await supabase
    .from("site_content")
    .upsert({ key: CONTENT_KEY, value: images }, { onConflict: "key" });

  if (error) {
    throw new Error(
      "Galeri sunucuya kaydedilemedi. Supabase şemasının (supabase/schema.sql) çalıştırıldığından emin olun.",
    );
  }
}
