import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import ImageField from "./ImageField";
import { CATEGORIES, type ProductInput } from "../../lib/types";

interface Props {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<string | null>;
}

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  image_url?: string;
}

const EMPTY = { name: "", category: "", price: "", description: "", image_url: "" };

export default function AddProductModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    const name = form.name.trim();
    if (name.length < 2) next.name = "Ürün adı en az 2 karakter olmalı.";

    if (!CATEGORIES.includes(form.category as (typeof CATEGORIES)[number])) {
      next.category = "Bir kategori seçin.";
    }

    const price = Number(form.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      next.price = "Geçerli bir fiyat girin (sıfırdan büyük).";
    }

    const image = form.image_url.trim();
    if (image && !/^(data:image\/|https?:\/\/)/i.test(image)) {
      next.image_url = "Geçerli bir görsel seçin veya http(s) bağlantısı girin.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    const message = await onSubmit({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price.replace(",", ".")),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
    });

    setSubmitting(false);

    if (message) {
      setSubmitError(message);
      return;
    }

    setForm(EMPTY);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-espresso-700/10 bg-cream-50 p-6 shadow-lift sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-product-title" className="font-serif text-2xl text-espresso-800">
              Yeni Ürün Ekle
            </h2>
            <p className="mt-1 text-sm text-espresso-800/60">
              Menüye eklenecek ürünün detaylarını girin.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="product-name" className="field-label">
              Ürün Adı *
            </label>
            <input
              id="product-name"
              type="text"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Örn. Flat White"
              className="input"
              autoFocus
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-espresso-600">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-category" className="field-label">
                Kategori *
              </label>
              <select
                id="product-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                className="input"
              >
                <option value="">Seçin…</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1.5 text-xs text-espresso-600">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="product-price" className="field-label">
                Fiyat (₺) *
              </label>
              <input
                id="product-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                placeholder="Örn. 145"
                className="input"
              />
              {errors.price && (
                <p className="mt-1.5 text-xs text-espresso-600">{errors.price}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="product-description" className="field-label">
              Açıklama
            </label>
            <textarea
              id="product-description"
              rows={3}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Örn. Çikolatamsı notalar, kadifemsi süt köpüğü."
              className="input resize-none"
            />
          </div>          <div>
            <ImageField
              value={form.image_url}
              onChange={(value) => update("image_url", value)}
              label="Ürün Fotoğrafı"
              hint="Cihazınızdan yükleyin, galeriden seçin veya bir bağlantı girin."
              showGalleryPicker
            />
            {errors.image_url && (
              <p className="mt-1.5 text-xs text-espresso-600">{errors.image_url}</p>
            )}
          </div>

          {submitError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-espresso-500/25 bg-espresso-700/5 px-4 py-3 text-sm text-espresso-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Vazgeç
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ekleniyor…
                </>
              ) : (
                "Ürünü Ekle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
