import { useRef, useState, type DragEvent } from "react";
import {
  AlertTriangle,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "../../lib/images";
import GalleryPicker from "./GalleryPicker";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  /** Önizleme alanının yükseklik/en-boy sınıfları. */
  previewClassName?: string;
  /** "Mekândan Kareler" galerisinden fotoğraf seçme seçeneğini göster. */
  showGalleryPicker?: boolean;
}

/**
 * Admin tarafında fotoğraf yükleme alanı: dosya seç veya sürükle-bırak,
 * önizleme, kaldır ve (isteğe bağlı) URL yapıştırma.
 */
export default function ImageField({
  value,
  onChange,
  label = "Fotoğraf",
  hint,
  previewClassName = "h-40 w-full",
  showGalleryPicker = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [picking, setPicking] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Görsel yüklenemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="field-label mb-0">{label}</span>
        <div className="mb-1.5 flex items-center gap-3">
          {showGalleryPicker && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-espresso-600 transition hover:text-espresso-800"
            >
              <Images className="h-3.5 w-3.5" />
              Galeriden Seç
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUrl((open) => !open)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-espresso-600 transition hover:text-espresso-800"
          >
            <Link2 className="h-3.5 w-3.5" />
            {showUrl ? "Bağlantıyı gizle" : "Bağlantı ile ekle"}
          </button>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border border-dashed transition ${
          dragging
            ? "border-caramel-500 bg-caramel-500/10"
            : "border-espresso-700/25 bg-white/60"
        }`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Seçilen fotoğraf"
              className={`${previewClassName} object-cover`}
            />
            <div className="absolute inset-x-2 bottom-2 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="btn btn-sm bg-espresso-800/85 text-cream-100 hover:bg-espresso-900"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Değiştir
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                aria-label="Fotoğrafı kaldır"
                className="btn btn-sm bg-cream-100/90 text-espresso-700 hover:bg-cream-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Kaldır
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={`flex ${previewClassName} w-full flex-col items-center justify-center gap-2 px-4 text-center transition hover:bg-espresso-700/5`}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-caramel-600" />
            ) : (
              <ImagePlus className="h-6 w-6 text-caramel-600" />
            )}
            <span className="text-sm font-semibold text-espresso-700">
              {busy ? "Yükleniyor…" : "Fotoğraf seç veya buraya sürükle"}
            </span>
            <span className="text-xs text-espresso-800/55">
              PNG, JPG veya WEBP · en fazla 10 MB
            </span>
          </button>
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

      {showUrl && (
        <input
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={(event) => onChange(event.target.value.trim())}
          placeholder="https://…"
          className="input mt-2"
        />
      )}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-espresso-800/55">{hint}</p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 text-xs text-espresso-600"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caramel-600" />
          {error}
        </p>
      )}

      {picking && (
        <GalleryPicker
          onClose={() => setPicking(false)}
          onSelect={(src) => {
            onChange(src);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
