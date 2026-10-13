import { useEffect, useRef, useState } from "react";
import { ImagePlus, Images, Loader2, X } from "lucide-react";
import { fetchGallery, type GalleryImage } from "../../lib/gallery";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "../../lib/images";

interface Props {
  /** Seçilen fotoğrafın adresi. */
  onSelect: (src: string) => void;
  onClose: () => void;
  /** Bu pencereden cihazdan yeni fotoğraf yükleme seçeneği. */
  allowUpload?: boolean;
  title?: string;
}

/**
 * "Mekândan Kareler" galerisindeki fotoğrafları listeleyip seçtiren pencere.
 * Ürün fotoğrafı gibi alanlarda hem mevcut galeri karelerini kullanmayı hem de
 * (istenirse) cihazdan yeni bir fotoğraf yüklemeyi sağlar.
 */
export default function GalleryPicker({
  onSelect,
  onClose,
  allowUpload = false,
  title = "Galeriden Seç",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await fetchGallery();
        if (active) setImages(rows.filter((row) => row.src.trim().length > 0));
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Galeri yüklenemedi.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onSelect(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-picker-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-espresso-700/10 bg-cream-50 p-6 shadow-lift sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="gallery-picker-title"
              className="font-serif text-xl text-espresso-800"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-espresso-800/60">
              "Mekândan Kareler" bölümündeki fotoğraflardan birini seçin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pencereyi kapat"
            className="rounded-full p-2 text-espresso-600/70 transition hover:bg-espresso-700/10 hover:text-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {allowUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn btn-outline btn-sm mt-5 w-fit"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Cihazdan Yükle
          </button>
        )}

        <div className="-mr-2 mt-5 flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-2xl bg-espresso-700/8"
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-2xl border border-espresso-700/10 bg-white/60 p-10 text-center">
              <Images className="mx-auto h-7 w-7 text-espresso-500/70" />
              <p className="mt-3 font-serif text-base text-espresso-800">
                Galeride fotoğraf yok
              </p>
              <p className="mt-1 text-sm text-espresso-800/60">
                Önce Galeri sekmesinden "Mekândan Kareler" fotoğrafı ekleyin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onSelect(image.src)}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-espresso-700/10 bg-espresso-700/10 text-left transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
                >
                  <img
                    src={image.src}
                    alt={image.alt || image.caption}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {image.caption && (
                    <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-espresso-900/75 px-2.5 py-1 text-xs font-medium text-cream-100 backdrop-blur">
                      {image.caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-espresso-600">
            {error}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
