import { useMemo, useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Coffee,
  CreditCard,
  Dices,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { useToast } from "../../Toast";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { categoryIcon } from "../../../lib/categoryIcons";
import { formatPrice } from "../../../lib/format";
import {
  PAYMENT_LABELS,
  orderItemCount,
  orderTotal,
  sectionLabel,
  type CafeTable,
  type PaymentMethod,
  type TableOrder,
} from "../../../lib/kasa";
import { printBillReceipt } from "../../../lib/receipt";
import {
  ALL_CATEGORIES,
  catalogCategories,
  filterCatalog,
  groupCatalog,
  productPhotoSources,
} from "../../../lib/catalog";
import type { Product } from "../../../lib/types";

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : timeFormatter.format(date);
}

interface Props {
  table: CafeTable;
  order: TableOrder | undefined;
  products: Product[];
  menuLoading: boolean;
  usingDemoMenu: boolean;
  onAdd: (product: Product) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemoveLine: (productId: string) => void;
  onCloseBill: (paymentMethod: PaymentMethod) => Promise<string | null>;
  onClose: () => void;
}

function OrderProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const imageSource = productPhotoSources(product).find(
    (source) => !failedSources.includes(source),
  );
  const Icon = categoryIcon(product.category);
  const available = product.is_available;

  return (
    <li>
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={!available}
        aria-label={
          available
            ? `${product.name} ürününü hesaba ekle`
            : `${product.name} tükendi`
        }
        className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
          available
            ? "border-espresso-700/10 hover:-translate-y-0.5 hover:border-caramel-500/45 hover:shadow-lift"
            : "cursor-not-allowed border-espresso-700/10 opacity-70"
        }`}
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-espresso-800">
          {imageSource ? (
            <img
              src={imageSource}
              alt={product.name}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-500 ${
                available ? "group-hover:scale-105" : "saturate-50"
              }`}
              onError={() =>
                setFailedSources((previous) =>
                  previous.includes(imageSource)
                    ? previous
                    : [...previous, imageSource],
                )
              }
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900 text-caramel-400">
              <Icon className="h-8 w-8 opacity-80" />
            </span>
          )}

          <span className="absolute left-2 top-2 max-w-[82%] truncate rounded-full bg-cream-100/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-espresso-600 backdrop-blur">
            {product.category}
          </span>

          {!available && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-cream-100 backdrop-blur">
              Tükendi
            </span>
          )}
        </span>

        <span className="flex flex-1 flex-col gap-2 p-3">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-espresso-800">
            {product.name}
          </span>
          <span className="mt-auto flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-espresso-700">
              {formatPrice(product.price)}
            </span>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                available
                  ? "bg-espresso-700 text-cream-50 group-hover:bg-espresso-800"
                  : "bg-espresso-700/10 text-espresso-600/50"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

export default function TableOrderModal({
  table,
  order,
  products,
  menuLoading,
  usingDemoMenu,
  onAdd,
  onIncrease,
  onDecrease,
  onRemoveLine,
  onCloseBill,
  onClose,
}: Props) {
  useBodyScrollLock();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [mobilePane, setMobilePane] = useState<"menu" | "bill">("menu");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [confirming, setConfirming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOkey = table.section === "okey";
  const total = orderTotal(order);
  const itemCount = orderItemCount(order);
  const open = itemCount > 0;

  const categories = useMemo(() => catalogCategories(products), [products]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filtered = useMemo(
    () => filterCatalog(products, activeCategory, query),
    [products, activeCategory, query],
  );
  const groups = useMemo(() => groupCatalog(filtered), [filtered]);
  const soldOutCount = useMemo(
    () => products.filter((product) => !product.is_available).length,
    [products],
  );

  const SectionIcon = isOkey ? Dices : Coffee;

  function handlePrintReceipt() {
    if (!order || order.lines.length === 0) return;
    const printed = printBillReceipt({
      tableLabel: table.label,
      section: table.section,
      lines: order.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      total,
      paymentMethod,
    });
    if (!printed) {
      toast.error("Fiş yazdırma penceresi açılamadı. Tekrar deneyin.");
    }
  }

  return (
    <div className="modal-safe fixed inset-0 z-[90] flex items-end justify-center bg-ink/65 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-order-title"
        className="flex max-h-94-safe w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-espresso-700/10 bg-cream-50 shadow-lift"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-espresso-700/10 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isOkey
                  ? "bg-[#315C4C] text-cream-50"
                  : "bg-espresso-700 text-caramel-400"
              }`}
            >
              <SectionIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="table-order-title"
                  className="font-serif text-xl text-espresso-800 sm:text-2xl"
                >
                  {table.label}
                </h2>
                <span className="rounded-full border border-espresso-700/15 bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-espresso-600">
                  {sectionLabel(table.section)}
                </span>
                {open && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-caramel-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-caramel-600" />
                    Açık
                  </span>
                )}
                {usingDemoMenu && (
                  <span className="rounded-full border border-espresso-700/15 px-2.5 py-0.5 text-[11px] font-medium text-espresso-600">
                    Örnek menü
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-espresso-800/55">
                {open && order
                  ? `${itemCount} ürün · Açılış ${formatTime(order.openedAt)}`
                  : "Boş masa · Menüden ürün ekleyerek hesabı açın"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Masa penceresini kapat"
            className="rounded-full p-2 text-espresso-600/70 transition hover:bg-espresso-700/10 hover:text-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-espresso-700/10 bg-cream-50/95 p-2 lg:hidden">
          {(
            [
              { id: "menu", label: "Menü", count: products.length },
              { id: "bill", label: "Masa Hesabı", count: itemCount },
            ] as const
          ).map((pane) => {
            const active = mobilePane === pane.id;
            return (
              <button
                key={pane.id}
                type="button"
                onClick={() => {
                  setMobilePane(pane.id);
                  scrollRef.current?.scrollTo({ top: 0 });
                }}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                  active
                    ? "bg-espresso-700 text-cream-100 shadow-soft"
                    : "text-espresso-700 hover:bg-espresso-700/10"
                }`}
              >
                {pane.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-cream-100/20 text-cream-100"
                      : "bg-espresso-700/10 text-espresso-600"
                  }`}
                >
                  {pane.count}
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={scrollRef}
          className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[1.15fr_0.85fr] lg:overflow-hidden"
        >
          <section
            className={`border-b border-espresso-700/10 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r ${
              mobilePane === "bill" ? "hidden lg:block" : ""
            }`}
          >
            <div className="sticky top-0 z-10 space-y-3 bg-cream-50/95 px-4 py-4 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-600/60" />
                <label htmlFor="order-menu-search" className="sr-only">
                  Menüde ara
                </label>
                <input
                  id="order-menu-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Menüde ara: tost, hamburger, latte…"
                  className="input h-11 bg-white py-2.5 pl-11 text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-espresso-800/55">
                <span>{products.length} menü ürünü</span>
                <span>
                  {soldOutCount > 0
                    ? `${soldOutCount} tükendi · yalnızca görüntülenir`
                    : "Tüm ürünler stokta"}
                </span>
              </div>

              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1">
                {[ALL_CATEGORIES, ...categories].map((category) => {
                  const isActive = activeCategory === category;
                  const count =
                    category === ALL_CATEGORIES
                      ? products.length
                      : (categoryCounts.get(category) ?? 0);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      aria-pressed={isActive}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                        isActive
                          ? "border-espresso-700 bg-espresso-700 text-cream-100"
                          : "border-espresso-700/15 bg-white/70 text-espresso-700 hover:border-espresso-700/35 hover:bg-white"
                      }`}
                    >
                      {category}
                      <span
                        className={`rounded-full px-1.5 text-[10px] ${
                          isActive
                            ? "bg-cream-100/20 text-cream-100"
                            : "bg-espresso-700/10 text-espresso-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-6 sm:px-6">
              {menuLoading && (
                <div
                  className="grid grid-cols-2 gap-2.5"
                  aria-label="Menü yükleniyor"
                >
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-52 animate-pulse rounded-2xl bg-espresso-700/10"
                    />
                  ))}
                </div>
              )}

              {!menuLoading && filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-espresso-700/20 bg-white/40 px-6 py-10 text-center">
                  <Coffee className="mx-auto h-7 w-7 text-espresso-500/70" />
                  <p className="mt-3 text-sm font-medium text-espresso-800">
                    Menüde ürün bulunamadı
                  </p>
                  <p className="mt-1 text-xs text-espresso-800/55">
                    Arama veya kategoriyi değiştirin.
                  </p>
                </div>
              )}

              {!menuLoading && filtered.length > 0 && (
                <div className="space-y-6">
                  {groups.map((group, index) => {
                    const GroupIcon = categoryIcon(group.category);
                    return (
                      <section
                        key={group.category}
                        aria-labelledby={`order-category-${index}`}
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-espresso-700/10 text-caramel-600">
                              <GroupIcon className="h-3.5 w-3.5" />
                            </span>
                            <h3
                              id={`order-category-${index}`}
                              className="font-serif text-lg text-espresso-800"
                            >
                              {group.category}
                            </h3>
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-espresso-800/40">
                            {group.products.length} ürün
                          </span>
                        </div>

                        <ul className="grid grid-cols-2 gap-2.5">
                          {group.products.map((product) => (
                            <OrderProductCard
                              key={product.id}
                              product={product}
                              onAdd={onAdd}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside
            className={`min-h-0 flex-col bg-white/55 lg:flex ${
              mobilePane === "menu" ? "hidden" : "flex"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-espresso-700/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-caramel-600" />
                <h3 className="font-serif text-lg text-espresso-800">
                  Masa Hesabı
                </h3>
              </div>
              <span className="rounded-full bg-espresso-700/10 px-2.5 py-0.5 text-xs font-semibold text-espresso-600">
                {itemCount} ürün
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {!order || order.lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-espresso-700/20 bg-cream-50/60 px-5 py-10 text-center">
                  <ReceiptText className="mx-auto h-8 w-8 text-espresso-500/60" />
                  <p className="mt-3 text-sm font-medium text-espresso-800">
                    Hesap henüz boş
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-espresso-800/55">
                    Soldaki menüden ürün ekleyin; toplam burada anlık olarak
                    hesaplanır.
                  </p>
                </div>
              ) : (
                order.lines.map((line) => (
                  <div
                    key={line.productId}
                    className="rounded-xl border border-espresso-700/10 bg-white/85 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-espresso-800">
                          {line.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-espresso-800/50">
                          {formatPrice(line.price)} / adet
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-espresso-800">
                        {formatPrice(line.price * line.quantity)}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDecrease(line.productId)}
                          aria-label={`${line.name} adedini azalt`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-espresso-700/15 bg-white text-espresso-700 transition hover:border-espresso-700/35 hover:bg-espresso-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-espresso-800">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrease(line.productId)}
                          aria-label={`${line.name} adedini artır`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-espresso-700/15 bg-white text-espresso-700 transition hover:border-espresso-700/35 hover:bg-espresso-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveLine(line.productId)}
                        aria-label={`${line.name} satırını kaldır`}
                        className="rounded-lg p-2 text-espresso-600/50 transition hover:bg-espresso-700/5 hover:text-espresso-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 z-10 shrink-0 border-t border-espresso-700/10 bg-cream-50/95 px-5 py-4 lg:static">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-espresso-800/60">Toplam</span>
                <span className="font-serif text-3xl text-espresso-900">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-espresso-800/45">
                  Ödeme
                </p>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-espresso-700/5 p-1">
                  {(["cash", "card"] as const).map((method) => {
                    const active = paymentMethod === method;
                    const Icon = method === "cash" ? Banknote : CreditCard;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        aria-pressed={active}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                          active
                            ? "bg-espresso-700 text-cream-100 shadow-soft"
                            : "text-espresso-700 hover:bg-white/70"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {PAYMENT_LABELS[method]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-espresso-800/50">
                Hesap kapatıldığında tutar genel kasaya işlenir ve masa boşa
                düşer.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  disabled={!open}
                  className="btn btn-outline btn-sm"
                >
                  <Printer className="h-4 w-4" />
                  Fiş
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={!open}
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Hesabı Kapat
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Hesap kapatılsın mı?"
          message={`${table.label} hesabı ${formatPrice(
            total,
          )} · ${PAYMENT_LABELS[paymentMethod]} olarak kapatılacak. Tutar genel kasaya işlenir ve masa boşa düşer.`}
          confirmLabel="Hesabı Kapat"
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            const message = await onCloseBill(paymentMethod);
            if (message) return message;
            onClose();
            return null;
          }}
        />
      )}
    </div>
  );
}
