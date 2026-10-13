import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Images,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import ImageField from "./ImageField";
import { useToast } from "../Toast";
import { useGallery } from "../../hooks/useGallery";
import {
  createGalleryId,
  DEFAULT_GALLERY,
  type GalleryImage,
} from "../../lib/gallery";

/**
 * "Mekândan Kareler" bölümünün yönetimi: admin fotoğraf ekler, değiştirir,
 * başlık/açıklama metnini düzenler ve galeriyi kaydeder.
 */
export default function GalleryEditor() {
  const toast = useToast();
  const { images, loading, error, reload, save } = useGallery();
  const [draft, setDraft] = useState<GalleryImage[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    setDraft(images);
    setDirty(false);
  }, [loading, images]);

  function update(id: string, patch: Partial<GalleryImage>) {
    setDraft((prev) =>
      prev.map((image) => (image.id === id ? { ...image, ...patch } : image)),
    );
    setDirty(true);
  }

  function remove(id: string) {
    setDraft((prev) => prev.filter((image) => image.id !== id));
    setDirty(true);
  }

  function addImage() {
    setDraft((prev) => [
      ...prev,
      { id: createGalleryId(), src: "", caption: "", alt: "" },
    ]);
    setDirty(true);
  }

  async function handleSave() {
    if (saving) return;
    const cleaned = draft
      .map((image) => ({
        ...image,
        caption: image.caption.trim(),
        alt: image.alt.trim() || image.caption.trim() || "Boss Cafe fotoğrafı",
      }))
      .filter((image) => image.src.trim().length > 0);

    if (cleaned.length === 0) {
      toast.error("En az bir fotoğraf ekleyin.");
      return;
    }

    setSaving(true);
    const message = await save(cleaned);
    setSaving(false);

    if (message) toast.error(message);
    else toast.success("Galeri güncellendi.");
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-espresso-800">
            Mekândan Kareler
          </h2>
          <p className="text-sm text-espresso-800/60">
            Ana sayfadaki galeri bölümünün fotoğraflarını buradan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_GALLERY);
              setDirty(true);
            }}
            className="btn btn-outline btn-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Varsayılana Dön
          </button>
          <button
            type="button"
            onClick={addImage}
            className="btn btn-outline btn-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Fotoğraf Ekle
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            className="btn btn-primary btn-sm"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Kaydet
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-espresso-500/30 bg-white/70 p-5 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-caramel-600" />
          <p className="mt-2 text-sm font-medium text-espresso-800">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="btn btn-outline btn-sm mt-4"
          >
            Tekrar Yükle
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card h-72 animate-pulse bg-white/50" />
          ))}
        </div>
      ) : draft.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <Images className="mx-auto h-8 w-8 text-espresso-500/70" />
          <p className="mt-3 font-serif text-lg text-espresso-800">
            Galeride fotoğraf yok
          </p>
          <p className="mt-1 text-sm text-espresso-800/60">
            Ana sayfada görünmesi için bir fotoğraf ekleyin.
          </p>
          <button
            type="button"
            onClick={addImage}
            className="btn btn-primary btn-sm mt-5"
          >
            <Plus className="h-4 w-4" />
            Fotoğraf Ekle
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {draft.map((image, index) => (
            <div key={image.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-espresso-800/50">
                  {index + 1}. kare
                </span>
                <button
                  type="button"
                  onClick={() => remove(image.id)}
                  aria-label={`${index + 1}. fotoğrafı kaldır`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-espresso-700/15 px-2.5 py-1 text-xs font-semibold text-espresso-600 transition hover:border-espresso-500/40 hover:bg-espresso-700/5 hover:text-espresso-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Kaldır
                </button>
              </div>

              <ImageField
                value={image.src}
                onChange={(src) => update(image.id, { src })}
                label="Fotoğraf"
                previewClassName="h-40 w-full"
              />

              <div>
                <label
                  htmlFor={`caption-${image.id}`}
                  className="field-label"
                >
                  Başlık
                </label>
                <input
                  id={`caption-${image.id}`}
                  type="text"
                  value={image.caption}
                  onChange={(event) =>
                    update(image.id, { caption: event.target.value })
                  }
                  placeholder="Örn. İç Mekân"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor={`alt-${image.id}`} className="field-label">
                  Alternatif metin
                </label>
                <input
                  id={`alt-${image.id}`}
                  type="text"
                  value={image.alt}
                  onChange={(event) =>
                    update(image.id, { alt: event.target.value })
                  }
                  placeholder="Görselin kısa tarifi"
                  className="input"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
