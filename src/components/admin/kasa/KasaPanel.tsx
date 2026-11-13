import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Dices,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import TableOrderModal from "./TableOrderModal";
import { useToast } from "../../Toast";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { formatPrice } from "../../../lib/format";
import { isSupabaseConfigured } from "../../../lib/supabase";
import {
  DEMO_MENU,
  nextTableLabel,
  orderItemCount,
  orderTotal,
  paymentLabel,
  sectionLabel,
  type CafeTable,
  type TableOrder,
  type TableSection,
} from "../../../lib/kasa";
import type { KasaApi } from "../../../hooks/useKasa";
import type { Product } from "../../../lib/types";

const collator = new Intl.Collator("tr", {
  numeric: true,
  sensitivity: "base",
});

interface KasaPanelProps {
  kasa: KasaApi;
  products: Product[];
  productsLoading: boolean;
  menuError: string | null;
  onOpenReport: () => void;
}

export default function KasaPanel({
  kasa,
  products,
  productsLoading,
  menuError,
  onOpenReport,
}: KasaPanelProps) {
  const toast = useToast();
  const ordersRef = useRef(kasa.orders);
  ordersRef.current = kasa.orders;
  // Modal açıkken arkadaki masa haritası ve özeti sabit tut: görünmeyen
  // kartların her ürün eklemesinde yeniden çizilmesi gereksiz. Kapatınca
  // güncel durum bir kerede yansır.
  const frozenOrdersRef = useRef<Record<string, TableOrder> | null>(null);
  const deferredOrders = useDeferredValue(kasa.orders);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const visibleOrders = frozenOrdersRef.current ?? deferredOrders;
  const [addSection, setAddSection] = useState<TableSection | null>(null);
  const [pendingRemove, setPendingRemove] = useState<CafeTable | null>(null);

  const totals = useMemo(() => {
    const openTables = kasa.tables.filter(
      (table) => orderItemCount(visibleOrders[table.id]) > 0,
    );
    const openTotal = kasa.tables.reduce(
      (sum, table) => sum + orderTotal(visibleOrders[table.id]),
      0,
    );
    return { openTables, openTotal };
  }, [kasa.tables, visibleOrders]);

  const summary = kasa.summary;

  const usingDemoMenu =
    !productsLoading &&
    products.length === 0 &&
    (!kasa.usingCloud || kasa.localFallback);
  const catalog = useMemo(() => {
    // The POS must mirror the public menu. Sold-out products stay visible and
    // are disabled inside the order screen instead of silently disappearing.
    if (products.length > 0) return products;
    if (productsLoading || (kasa.usingCloud && !kasa.localFallback)) return [];
    return DEMO_MENU;
  }, [products, productsLoading, kasa.usingCloud, kasa.localFallback]);

  function reportAction(action: Promise<string | null>) {
    void action
      .then((message) => {
        if (message) toast.error(message);
      })
      .catch(() => {
        toast.error(
          "İşlem tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.",
        );
      });
  }

  const selectedTable =
    kasa.tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedOrder = selectedTable
    ? kasa.orders[selectedTable.id]
    : undefined;

  const handleOpenTable = useCallback((tableId: string) => {
    frozenOrdersRef.current = ordersRef.current;
    setSelectedTableId(tableId);
  }, []);

  const handleCloseTable = useCallback(() => {
    frozenOrdersRef.current = null;
    setSelectedTableId(null);
  }, []);

  function openReport() {
    onOpenReport();
  }

  const requestRemoveTable = useCallback(
    (table: CafeTable) => {
      if (orderItemCount(ordersRef.current[table.id]) > 0) {
        toast.error(
          `${table.label} üzerinde açık hesap var. Önce hesabı kapatın.`,
        );
        return;
      }
      setPendingRemove(table);
    },
    [toast],
  );

  const summaryCards = [
    {
      label: "Genel Kasa",
      value: summary ? formatPrice(summary.allRevenue) : "—",
      hint: summary
        ? `${summary.allCount} kapatılan hesap`
        : "Özet bekleniyor",
      icon: Landmark,
      dark: true,
    },
    {
      label: "Bugünkü Ciro",
      value: summary ? formatPrice(summary.todayRevenue) : "—",
      hint: summary ? `${summary.todayCount} hesap · Bugün` : "Özet bekleniyor",
      icon: TrendingUp,
      dark: false,
    },
    {
      label: "Açık Hesaplar",
      value: formatPrice(totals.openTotal),
      hint: `${totals.openTables.length} masa açık`,
      icon: Timer,
      dark: false,
    },
    {
      label: "Bugün Kapanan",
      value: summary ? String(summary.todayCount) : "—",
      hint: "Masa hesabı",
      icon: CheckCircle2,
      dark: false,
    },
  ];

  return (
    <div className="mt-8 space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-espresso-800">
            Kasa &amp; Masalar
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-espresso-800/60">
            Masaya tıklayıp menüdeki tüm ürünlerden adisyona ekleyin. Tükendi
            işaretli ürünler listede görünür; stok açılınca tek dokunuşla
            satılabilir. Hesap kapatıldığında tutar genel kasaya işlenir.
          </p>
          <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-espresso-800/50">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !kasa.usingCloud
                  ? "bg-espresso-500/50"
                  : kasa.loading
                    ? "animate-pulse bg-caramel-500"
                    : kasa.error || kasa.syncState === "offline"
                      ? "bg-[#9C3B2C]"
                      : "bg-[#315C4C]"
              }`}
            />
            {!kasa.usingCloud
              ? "Önizleme · kayıtlar bu tarayıcıda"
              : kasa.loading
                ? "Supabase'e bağlanıyor…"
                : kasa.localFallback
                  ? "Geçici olarak bu cihazda · Supabase kurulumu gerekli"
                  : kasa.error || kasa.syncState === "offline"
                    ? "Bağlantı sorunu · kayıtlar yeniden denenecek"
                    : "Supabase · telefon ve masaüstü ortak kasa"}
          </p>
        </div>
        <button type="button" onClick={openReport} className="btn btn-outline btn-sm">
          <ReceiptText className="h-4 w-4" />
          Gün Sonu Raporu
        </button>
      </div>

      {kasa.loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-espresso-700/10 bg-white/60 px-4 py-3 text-sm text-espresso-700">
          <Loader2 className="h-4 w-4 animate-spin text-caramel-600" />
          Masalar ve açık adisyonlar Supabase'den yükleniyor…
        </div>
      )}

      {kasa.error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-[#9C3B2C]/25 bg-[#9C3B2C]/5 p-4 text-sm text-espresso-700 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9C3B2C]" />
            <div>
              <p className="font-semibold text-espresso-800">
                Kasa veritabanına ulaşılamadı
              </p>
              <p className="mt-1 leading-relaxed">{kasa.error}</p>
              {kasa.localFallback && (
                <p className="mt-2 text-xs leading-relaxed text-espresso-700/70">
                  Kasa şimdilik yalnızca bu cihazda çalışıyor. Şema
                  çalıştırıldığında ortak kasa otomatik devreye girer; telefon
                  ve masaüstü aynı kayıtları görür.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void kasa.reload()}
            className="btn btn-outline btn-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrar Dene
          </button>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-caramel-500/35 bg-caramel-500/10 p-4 text-sm text-espresso-700">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
          <p className="leading-relaxed">
            <span className="font-semibold text-espresso-800">
              Önizleme modu.
            </span>{" "}
            Masa, adisyon ve kasa kayıtları bu tarayıcıda saklanır. Menü
            bağlanamadığı için sipariş ekranı örnek menüyle çalışır; Supabase
            anahtarları eklendiğinde gerçek ürünler ve cihazlar arası ortak
            kasa otomatik devreye girer.
          </p>
        </div>
      )}

      {isSupabaseConfigured && menuError && (
        <div className="flex items-start gap-3 rounded-2xl border border-espresso-500/30 bg-white/70 p-4 text-sm text-espresso-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
          <p className="leading-relaxed">
            Menü sunucusuna ulaşılamadı. Ürünler gelmeden yeni adisyon
            açılmaması için menüyü yenileyin; masa ve kasa kayıtları mevcut
            modda korunmaya devam eder.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, hint, icon: Icon, dark }) => (
          <div
            key={label}
            className={
              dark
                ? "rounded-2xl border border-espresso-800 bg-espresso-800 p-5 shadow-lift"
                : "card p-5"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  dark ? "text-cream-200/60" : "text-espresso-800/50"
                }`}
              >
                {label}
              </p>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  dark
                    ? "bg-caramel-500/15 text-caramel-400"
                    : "bg-espresso-700/10 text-caramel-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p
              className={`mt-3 font-serif text-2xl leading-none ${
                dark ? "text-cream-50" : "text-espresso-800"
              }`}
            >
              {value}
            </p>
            <p
              className={`mt-1.5 text-xs ${
                dark ? "text-cream-200/55" : "text-espresso-800/50"
              }`}
            >
              {hint}
            </p>
          </div>
        ))}
      </div>

      <SectionMap
        section="cafe"
        tables={kasa.tables}
        orders={visibleOrders}
        onOpenTable={handleOpenTable}
        onAddTable={() => setAddSection("cafe")}
        onRemoveTable={requestRemoveTable}
      />

      <SectionMap
        section="okey"
        tables={kasa.tables}
        orders={visibleOrders}
        onOpenTable={handleOpenTable}
        onAddTable={() => setAddSection("okey")}
        onRemoveTable={requestRemoveTable}
      />

      {selectedTable && (
        <TableOrderModal
          table={selectedTable}
          order={selectedOrder}
          products={catalog}
          menuLoading={productsLoading}
          usingDemoMenu={usingDemoMenu}
          onAdd={(product) =>
            reportAction(kasa.addItem(selectedTable.id, product))
          }
          onIncrease={(productId) =>
            reportAction(
              kasa.changeQuantity(selectedTable.id, productId, 1),
            )
          }
          onDecrease={(productId) =>
            reportAction(
              kasa.changeQuantity(selectedTable.id, productId, -1),
            )
          }
          onRemoveLine={(productId) =>
            reportAction(kasa.removeLine(selectedTable.id, productId))
          }
          onCloseBill={async (paymentMethod) => {
            const amount = orderTotal(kasa.orders[selectedTable.id]);
            const message = await kasa.closeTable(
              selectedTable.id,
              paymentMethod,
            );
            if (message) return message;
            toast.success(
              `${selectedTable.label} hesabı kapatıldı · ${formatPrice(
                amount,
              )} · ${paymentLabel(paymentMethod)} genel kasaya işlendi.`,
            );
            return null;
          }}
          onClose={handleCloseTable}
        />
      )}

      {addSection && (
        <AddTableModal
          defaultSection={addSection}
          tables={kasa.tables}
          onClose={() => setAddSection(null)}
          onSubmit={async (section, label) => {
            const message = await kasa.addTable(section, label);
            if (message) return message;
            toast.success(
              `${sectionLabel(section)} bölümüne "${label}" eklendi.`,
            );
            return null;
          }}
        />
      )}

      {pendingRemove && (
        <ConfirmDialog
          title="Masa kaldırılsın mı?"
          message={
            orderItemCount(kasa.orders[pendingRemove.id]) > 0
              ? `${pendingRemove.label} üzerinde açık bir hesap var. Masayı kaldırmadan önce hesabı kapatmalısınız.`
              : `${pendingRemove.label} haritadan kaldırılacak. Bu işlem geri alınamaz.`
          }
          confirmLabel="Masayı Kaldır"
          onClose={() => setPendingRemove(null)}
          onConfirm={async () => {
            const message = await kasa.removeTable(pendingRemove.id);
            if (message) return message;
            toast.success(`${pendingRemove.label} kaldırıldı.`);
            return null;
          }}
        />
      )}
    </div>
  );
}

interface SectionMapProps {
  section: TableSection;
  tables: CafeTable[];
  orders: Record<string, TableOrder>;
  onOpenTable: (tableId: string) => void;
  onAddTable: () => void;
  onRemoveTable: (table: CafeTable) => void;
}

function SectionMap({
  section,
  tables,
  orders,
  onOpenTable,
  onAddTable,
  onRemoveTable,
}: SectionMapProps) {
  const isOkey = section === "okey";
  const sectionTables = tables
    .filter((table) => table.section === section)
    .sort((a, b) => collator.compare(a.label, b.label));

  const openCount = sectionTables.filter(
    (table) => orderItemCount(orders[table.id]) > 0,
  ).length;
  const openTotal = sectionTables.reduce(
    (sum, table) => sum + orderTotal(orders[table.id]),
    0,
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-espresso-700/10 bg-white/45">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso-700/10 bg-cream-50/70 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isOkey
                ? "bg-[#315C4C] text-cream-50"
                : "bg-espresso-700 text-caramel-400"
            }`}
          >
            {isOkey ? (
              <Dices className="h-5 w-5" />
            ) : (
              <Coffee className="h-5 w-5" />
            )}
          </span>
          <div>
            <h3 className="font-serif text-xl text-espresso-800">
              {sectionLabel(section)}
            </h3>
            <p className="text-xs text-espresso-800/55">
              {sectionTables.length} masa · {openCount} açık
              {openCount > 0 && ` · ${formatPrice(openTotal)} açık hesap`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddTable}
          className="btn btn-outline btn-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Masa Ekle
        </button>
      </div>

      <div className="p-4 sm:p-6">
        <div
          className={`rounded-2xl border border-dashed p-4 sm:p-5 ${
            isOkey
              ? "border-[#315C4C]/25 bg-[#315C4C]/[0.04]"
              : "border-espresso-700/20 bg-cream-100/55"
          }`}
        >
          <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-800/35">
            <span>{isOkey ? "Okey Salonu" : "Bar / Sipariş"}</span>
            <span>Giriş</span>
          </div>

          {sectionTables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-espresso-700/20 bg-white/50 px-6 py-8 text-center">
              <p className="font-serif text-lg text-espresso-800">
                Bu bölümde masa yok
              </p>
              <p className="mt-1 text-sm text-espresso-800/55">
                Haritaya ilk masayı ekleyerek başlayın.
              </p>
              <button
                type="button"
                onClick={onAddTable}
                className="btn btn-primary btn-sm mt-4"
              >
                <Plus className="h-3.5 w-3.5" />
                Masa Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sectionTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  order={orders[table.id]}
                  onOpen={onOpenTable}
                  onRemove={onRemoveTable}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const TableCard = memo(function TableCard({
  table,
  order,
  onOpen,
  onRemove,
}: {
  table: CafeTable;
  order: TableOrder | undefined;
  onOpen: (tableId: string) => void;
  onRemove: (table: CafeTable) => void;
}) {
  const count = orderItemCount(order);
  const total = orderTotal(order);
  const open = count > 0;
  const isOkey = table.section === "okey";

  const chairClass = open
    ? isOkey
      ? "bg-caramel-500/70"
      : "bg-caramel-500"
    : isOkey
      ? "bg-[#315C4C]/30"
      : "bg-espresso-700/20";

  return (
    <div
      className={`group relative rounded-2xl border p-3 transition ${
        open
          ? "border-caramel-500/45 bg-white shadow-soft"
          : "border-espresso-700/10 bg-white/55 hover:border-espresso-700/30 hover:bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(table.id)}
        aria-label={`${table.label} hesabını aç`}
        className="flex w-full flex-col items-center gap-2.5 rounded-xl py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500"
      >
        <span className="relative flex h-[72px] w-[72px] items-center justify-center">
          <span
            className={`absolute -top-0.5 left-1/2 h-2.5 w-6 -translate-x-1/2 rounded-full ${chairClass}`}
          />
          <span
            className={`absolute -bottom-0.5 left-1/2 h-2.5 w-6 -translate-x-1/2 rounded-full ${chairClass}`}
          />
          <span
            className={`absolute -left-0.5 top-1/2 h-6 w-2.5 -translate-y-1/2 rounded-full ${chairClass}`}
          />
          <span
            className={`absolute -right-0.5 top-1/2 h-6 w-2.5 -translate-y-1/2 rounded-full ${chairClass}`}
          />
          <span
            className={`flex h-[52px] w-[52px] items-center justify-center border-2 transition ${
              isOkey ? "rounded-xl" : "rounded-full"
            } ${
              open
                ? isOkey
                  ? "border-caramel-400 bg-[#315C4C] text-cream-50"
                  : "border-caramel-500 bg-caramel-500/15 text-caramel-700"
                : isOkey
                  ? "border-[#315C4C]/30 bg-[#315C4C]/10 text-[#315C4C]/70"
                  : "border-espresso-700/20 bg-espresso-700/5 text-espresso-600/60"
            }`}
          >
            {isOkey ? (
              <Dices className="h-4 w-4" />
            ) : (
              <Coffee className="h-4 w-4" />
            )}
          </span>
        </span>

        <span className="w-full">
          <span className="block truncate font-serif text-base text-espresso-800">
            {table.label}
          </span>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              open
                ? "bg-caramel-500/15 text-caramel-700"
                : "bg-espresso-700/5 text-espresso-800/45"
            }`}
          >
            {open && <span className="h-1 w-1 rounded-full bg-caramel-600" />}
            {open ? "Açık" : "Boş"}
          </span>
          <span className="mt-1 block truncate text-xs text-espresso-800/55">
            {open ? `${count} ürün · ${formatPrice(total)}` : "Hesap yok"}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRemove(table)}
        aria-label={`${table.label} masasını kaldır`}
        className="absolute right-1.5 top-1.5 rounded-full border border-espresso-700/10 bg-cream-50/90 p-2 text-espresso-600/55 opacity-60 shadow-sm transition hover:border-espresso-500/40 hover:text-espresso-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
});

function AddTableModal({
  defaultSection,
  tables,
  onClose,
  onSubmit,
}: {
  defaultSection: TableSection;
  tables: CafeTable[];
  onClose: () => void;
  onSubmit: (
    section: TableSection,
    label: string,
  ) => Promise<string | null>;
}) {
  useBodyScrollLock();
  const [section, setSection] = useState<TableSection>(defaultSection);
  const [label, setLabel] = useState(() =>
    nextTableLabel(tables, defaultSection),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function chooseSection(next: TableSection) {
    setSection(next);
    setLabel(nextTableLabel(tables, next));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const message = await onSubmit(section, label);
      if (message) {
        setError(message);
        return;
      }
      onClose();
    } catch {
      setError("Masa eklenemedi. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-safe fixed inset-0 z-[95] flex items-end justify-center bg-ink/65 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-table-title"
        className="max-h-94-safe w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-espresso-700/10 bg-cream-50 p-6 shadow-lift sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="add-table-title"
              className="font-serif text-2xl text-espresso-800"
            >
              Masa Ekle
            </h2>
            <p className="mt-1 text-sm text-espresso-800/60">
              Masa haritasına yeni bir masa ekleyin.
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
            <span className="field-label">Bölüm</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-espresso-700/5 p-1">
              {(["cafe", "okey"] as const).map((value) => {
                const active = section === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseSection(value)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
                      active
                        ? "bg-espresso-700 text-cream-100 shadow-soft"
                        : "text-espresso-700 hover:bg-white/70"
                    }`}
                  >
                    {value === "cafe" ? (
                      <Coffee className="h-4 w-4" />
                    ) : (
                      <Dices className="h-4 w-4" />
                    )}
                    {sectionLabel(value)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="table-label" className="field-label">
              Masa Adı
            </label>
            <input
              id="table-label"
              type="text"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                setError(null);
              }}
              placeholder="Örn. Masa 9"
              className="input"
              maxLength={60}
              autoFocus
              required
            />
            <p className="mt-1.5 text-xs text-espresso-800/50">
              Aynı bölümde benzer isim kullanılamaz.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-espresso-500/25 bg-espresso-700/5 px-4 py-3 text-sm text-espresso-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Vazgeç
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {submitting ? "Ekleniyor…" : "Masayı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
