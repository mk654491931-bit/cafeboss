import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/gallery";
import { toTurkishError } from "../lib/errors";
import { DEFAULT_GALLERY, type GalleryImage } from "../lib/gallery";

/**
 * "Mekândan Kareler" galerisinin tek kaynağı. Okuma Supabase (ya da yerel
 * yedek) üzerinden yapılır; `save` mutasyonu null dönerse başarılıdır,
 * aksi hâlde Türkçe hata mesajı döner.
 */
export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>(DEFAULT_GALLERY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.fetchGallery();
      setImages(rows);
    } catch (caught) {
      setError(toTurkishError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (next: GalleryImage[]): Promise<string | null> => {
      const previous = images;
      setImages(next);
      try {
        await api.saveGallery(next);
        return null;
      } catch (caught) {
        setImages(previous);
        return toTurkishError(caught);
      }
    },
    [images],
  );

  return { images, loading, error, reload, save };
}
