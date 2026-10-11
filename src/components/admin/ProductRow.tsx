import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { categoryIcon } from "../../lib/categoryIcons";
import { useToast } from "../Toast";
import type { Product } from "../../lib/types";

interface Props {
  product: Product;
  onPrice: (id: string, price: number) => Promise<string | null>;
  onAvailability: (id: string, isAvailable: boolean) => Promise<string | null>;
  onDelete: (product: Product) => void;
}

function PriceEditor({
  product,
  onPrice,
}: {
  product: Product;
  onPrice: Props["onPrice"];
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(product.price));
  const [saving, setSaving] = useState(false);
  const cancelRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(product.price));
  }, [editing, product.price]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function commit() {
    if (saving) return;
    const value = Number(draft.replace(",", ".").trim());

    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Geçerli bir fiyat girin.");
      setDraft(String(product.price));
      setEditing(false);
      return;
    }

    if (value === product.price) {
      setEditing(false);
      return;
    }

    setEditing(false);
    setSaving(true);
    const message = await onPrice(product.id, value);
    setSaving(false);

    if (message) toast.error(message);
    else toast.success(`${product.name} fiyatı güncellendi.`);
  }

  if (editing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void commit();
        }}
        className="flex items-center gap-1"
      >
        <span className="text-sm text-espresso-600">₺</span>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (cancelRef.current) {
              cancelRef.current = false;
              return;
            }
            void commit();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancelRef.current = true;
              setDraft(String(product.price));
              setEditing(false);
            }
          }}
          aria-label={`${product.name} fiyatı`}
          className="w-24 rounded-lg border border-caramel-500/60 bg-white px-2 py-1.5 text-sm font-semibold text-espresso-800 focus:outline-none focus:ring-2 focus:ring-caramel-500/40"
        />
        <button
          type="submit"
          aria-label="Fiyatı kaydet"
          className="rounded-lg bg-espresso-700 p-1.5 text-cream-100 transition hover:bg-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
        >
          <Check className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={saving}
      aria-label={`${product.name} fiyatını düzenle`}
      className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-espresso-700 transition hover:bg-espresso-700/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-caramel-600" />
      ) : (
        <Pencil className="h-3.5 w-3.5 text-caramel-600 opacity-0 transition group-hover:opacity-100" />
      )}
      {formatPrice(product.price)}
    </button>
  );
}

function AvailabilityToggle({
  product,
  onAvailability,
}: {
  product: Product;
  onAvailability: Props["onAvailability"];
}) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const available = product.is_available;

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    const message = await onAvailability(product.id, !available);
    setPending(false);

    if (message) toast.error(message);
    else
      toast.success(
        `${product.name} ${!available ? "menüde aktif" : "olarak işaretlendi"}.`,
      );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={`${product.name} durumu`}
      onClick={() => void handleToggle()}
      disabled={pending}
      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
          available ? "bg-espresso-700" : "bg-espresso-700/25"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow transition-transform duration-300 ${
            available ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span
        className={`text-xs font-semibold ${
          available ? "text-espresso-700" : "text-espresso-600/60"
        }`}
      >
        {available ? "Aktif" : "Tükendi"}
      </span>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-caramel-600" />}
    </button>
  );
}

export default function ProductRow({ product, onPrice, onAvailability, onDelete }: Props) {
  const CategoryIcon = categoryIcon(product.category);

  return (
    <div className="card p-4 transition hover:shadow-lift md:grid md:grid-cols-[minmax(0,2.4fr)_auto_auto_auto] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-espresso-700/8 text-caramel-600">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <CategoryIcon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-espresso-800">{product.name}</p>
          <p className="truncate text-xs text-espresso-800/55">
            {product.category}
            {product.description ? ` · ${product.description}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 md:contents">
        <div className="md:justify-self-start">
          <PriceEditor product={product} onPrice={onPrice} />
        </div>
        <div className="md:justify-self-start">
          <AvailabilityToggle product={product} onAvailability={onAvailability} />
        </div>
        <div className="md:justify-self-end">
          <button
            type="button"
            onClick={() => onDelete(product)}
            aria-label={`${product.name} ürününü sil`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-espresso-700/15 px-3 py-1.5 text-xs font-semibold text-espresso-600 transition hover:border-espresso-500/40 hover:bg-espresso-700/5 hover:text-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
