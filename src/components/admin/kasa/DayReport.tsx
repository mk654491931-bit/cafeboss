import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  Dices,
  Download,
  Printer,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "../../Toast";
import { formatPrice } from "../../../lib/format";
import {
  buildSalesCsv,
  dateFromKey,
  dateKey,
  paymentLabel,
  sectionLabel,
  shiftDateKey,
  todayKey,
  type Sale,
} from "../../../lib/kasa";
import { printBillReceipt } from "../../../lib/receipt";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatReportDate(key: string): string {
  return dateFormatter.format(dateFromKey(key));
}

function saleItemCount(sale: Sale): number {
  return sale.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function saleSummary(sale: Sale): string {
  return sale.lines
    .map((line) => `${line.quantity}× ${line.name}`)
    .join(", ");
}

interface DayReportProps {
  sales: Sale[];
  onBackToKasa: () => void;
}

export default function DayReport({ sales, onBackToKasa }: DayReportProps) {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const dailySales = useMemo(
    () =>
      sales
        .filter((sale) => dateKey(sale.closedAt) === selectedDate)
        .sort((a, b) => b.closedAt.localeCompare(a.closedAt)),
    [sales, selectedDate],
  );

  const stats = useMemo(() => {
    const revenue = dailySales.reduce((sum, sale) => sum + sale.total, 0);
    const itemCount = dailySales.reduce(
      (sum, sale) => sum + saleItemCount(sale),
      0,
    );
    const average = dailySales.length > 0 ? revenue / dailySales.length : 0;
    const cashTotal = dailySales
      .filter((sale) => sale.paymentMethod !== "card")
      .reduce((sum, sale) => sum + sale.total, 0);
    const cardTotal = dailySales
      .filter((sale) => sale.paymentMethod === "card")
      .reduce((sum, sale) => sum + sale.total, 0);

    const sections = (["cafe", "okey"] as const).map((section) => {
      const rows = dailySales.filter((sale) => sale.section === section);
      return {
        section,
        count: rows.length,
        revenue: rows.reduce((sum, sale) => sum + sale.total, 0),
      };
    });

    const productMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    for (const sale of dailySales) {
      for (const line of sale.lines) {
        const current = productMap.get(line.name) ?? {
          name: line.name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += line.quantity;
        current.revenue += line.quantity * line.price;
        productMap.set(line.name, current);
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    return {
      revenue,
      itemCount,
      average,
      cashTotal,
      cardTotal,
      sections,
      topProducts,
    };
  }, [dailySales]);

  const generatedAt = new Date();

  function downloadCsv() {
    if (dailySales.length === 0) {
      toast.error("Bu tarihte indirilecek kapanmış hesap yok.");
      return;
    }

    const csv = buildSalesCsv(dailySales);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `boss-cafe-gun-sonu-${selectedDate}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Gün sonu CSV dosyası indirildi.");
  }

  function printSaleReceipt(sale: Sale) {
    const printed = printBillReceipt({
      tableLabel: sale.tableLabel,
      section: sale.section,
      lines: sale.lines,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      closedAt: sale.closedAt,
    });
    if (!printed) {
      toast.error("Fiş yazdırma penceresi açılamadı. Tekrar deneyin.");
    }
  }

  return (
    <div className="report-print mt-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-eyebrow">
            <CalendarDays className="h-3.5 w-3.5" />
            Gün Sonu
          </span>
          <h2 className="mt-3 font-serif text-2xl text-espresso-800">
            Gün Sonu Raporu
          </h2>
          <p className="mt-1 text-sm text-espresso-800/60">
            Kapanan masa hesapları, günlük ciro ve ürün dağılımı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onBackToKasa}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kasaya Dön
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={dailySales.length === 0}
            className="btn btn-outline btn-sm"
          >
            <Download className="h-3.5 w-3.5" />
            CSV İndir
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary btn-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Raporu Yazdır
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-espresso-700/10 bg-white/65 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-espresso-700/10 bg-cream-50/70 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedDate((current) => shiftDateKey(current, -1))
              }
              aria-label="Önceki gün"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-espresso-700/15 bg-white/80 text-espresso-700 transition hover:bg-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 print:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <label htmlFor="report-date" className="sr-only">
              Rapor tarihi
            </label>
            <input
              id="report-date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value);
              }}
              className="rounded-xl border border-espresso-700/15 bg-white/80 px-3 py-2 text-sm font-medium text-espresso-800 focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-500/30 print:hidden"
            />

            <button
              type="button"
              onClick={() =>
                setSelectedDate((current) => shiftDateKey(current, 1))
              }
              aria-label="Sonraki gün"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-espresso-700/15 bg-white/80 text-espresso-700 transition hover:bg-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 print:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className="rounded-xl border border-espresso-700/15 bg-white/80 px-3 py-2 text-xs font-semibold text-espresso-700 transition hover:bg-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 print:hidden"
            >
              Bugün
            </button>
          </div>

          <p className="text-sm font-medium capitalize text-espresso-800/70">
            {formatReportDate(selectedDate)}
          </p>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
          <ReportStat
            label="Günlük Ciro"
            value={formatPrice(stats.revenue)}
            hint={`${dailySales.length} kapanan masa`}
            icon={Wallet}
            accent
          />
          <ReportStat
            label="Nakit"
            value={formatPrice(stats.cashTotal)}
            hint="Nakit tahsilat"
            icon={Banknote}
          />
          <ReportStat
            label="Kart"
            value={formatPrice(stats.cardTotal)}
            hint="Kart tahsilatı"
            icon={CreditCard}
          />
          <ReportStat
            label="Satılan Ürün"
            value={String(stats.itemCount)}
            hint="Toplam adet"
            icon={ShoppingBag}
          />
          <ReportStat
            label="Ortalama Hesap"
            value={formatPrice(stats.average)}
            hint="Masa başına"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-5 border-t border-espresso-700/10 p-4 sm:p-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-espresso-700/10 bg-white/70 p-4 sm:p-5 print:break-inside-avoid">
            <h3 className="font-serif text-lg text-espresso-800">
              Bölüm Dağılımı
            </h3>
            <div className="mt-4 space-y-4">
              {stats.sections.map(({ section, count, revenue }) => {
                const isOkey = section === "okey";
                const share =
                  stats.revenue > 0
                    ? Math.round((revenue / stats.revenue) * 100)
                    : 0;
                return (
                  <div key={section}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-espresso-800">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                            isOkey
                              ? "bg-[#315C4C]/10 text-[#315C4C]"
                              : "bg-espresso-700/10 text-caramel-600"
                          }`}
                        >
                          {isOkey ? (
                            <Dices className="h-3.5 w-3.5" />
                          ) : (
                            <Coffee className="h-3.5 w-3.5" />
                          )}
                        </span>
                        {sectionLabel(section)}
                      </span>
                      <span className="text-sm font-semibold text-espresso-800">
                        {formatPrice(revenue)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-espresso-700/10">
                      <div
                        className={`h-full rounded-full ${
                          isOkey ? "bg-[#315C4C]" : "bg-caramel-500"
                        }`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-espresso-800/45">
                      {count} hesap · cironun %{share}'i
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-espresso-700/10 bg-white/70 p-4 sm:p-5 print:break-inside-avoid">
            <h3 className="font-serif text-lg text-espresso-800">
              En Çok Satanlar
            </h3>
            {stats.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-espresso-800/50">
                Bu tarihte satılan ürün yok.
              </p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {stats.topProducts.map((product, index) => (
                  <li
                    key={product.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-espresso-700/5 text-[11px] font-bold text-espresso-600">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm text-espresso-800">
                        {product.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-espresso-800/55">
                      <span className="font-semibold text-espresso-800">
                        {product.quantity} adet
                      </span>{" "}
                      · {formatPrice(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="border-t border-espresso-700/10">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
            <h3 className="font-serif text-lg text-espresso-800">
              Kapanan Hesaplar
            </h3>
            <span className="rounded-full bg-espresso-700/10 px-3 py-1 text-xs font-semibold text-espresso-600">
              {dailySales.length} adisyon
            </span>
          </div>

          {dailySales.length === 0 ? (
            <div className="px-4 pb-8 pt-2 text-center sm:px-6">
              <ReceiptText className="mx-auto h-8 w-8 text-espresso-500/55" />
              <p className="mt-3 font-serif text-lg text-espresso-800">
                Bu tarihte kapanan hesap yok
              </p>
              <p className="mt-1 text-sm text-espresso-800/55">
                Günlük ciro, kasa bölümünde hesap kapattıkça burada oluşur.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-espresso-700/10">
              {dailySales.map((sale) => {
                const isOkey = sale.section === "okey";
                return (
                  <li
                    key={sale.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isOkey
                            ? "bg-[#315C4C]/10 text-[#315C4C]"
                            : "bg-espresso-700/10 text-caramel-600"
                        }`}
                      >
                        {isOkey ? (
                          <Dices className="h-4 w-4" />
                        ) : (
                          <Coffee className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-espresso-800">
                          {sale.tableLabel}
                          <span className="rounded-full border border-espresso-700/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso-600/70">
                            {sectionLabel(sale.section)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              sale.paymentMethod === "card"
                                ? "bg-espresso-700/10 text-espresso-700"
                                : "bg-caramel-500/15 text-caramel-700"
                            }`}
                          >
                            {paymentLabel(sale.paymentMethod)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-espresso-800/45">
                          {timeFormatter.format(new Date(sale.closedAt))} ·{" "}
                          {saleItemCount(sale)} ürün
                        </p>
                        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-espresso-800/55">
                          {saleSummary(sale)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-serif text-base text-espresso-800">
                        {formatPrice(sale.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => printSaleReceipt(sale)}
                        aria-label={`${sale.tableLabel} fişini yazdır`}
                        className="inline-flex items-center gap-1 rounded-lg border border-espresso-700/15 px-2 py-1 text-[10px] font-semibold text-espresso-600 transition hover:border-espresso-700/35 hover:bg-espresso-700/5 hover:text-espresso-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 print:hidden"
                      >
                        <Printer className="h-3 w-3" />
                        Fiş
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-espresso-700/10 bg-espresso-700/5 px-4 py-4 sm:px-6">
            <span className="text-sm font-semibold text-espresso-800">
              Günlük Toplam
            </span>
            <span className="font-serif text-2xl text-espresso-900">
              {formatPrice(stats.revenue)}
            </span>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-espresso-800/40">
        Boss Cafe · {formatReportDate(selectedDate)} · Rapor oluşturma{" "}
        {generatedAt.toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function ReportStat({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 print:break-inside-avoid ${
        accent
          ? "border-caramel-500/35 bg-caramel-500/10"
          : "border-espresso-700/10 bg-white/70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-espresso-800/50">
          {label}
        </p>
        <Icon className="h-4 w-4 text-caramel-600" />
      </div>
      <p className="mt-2 font-serif text-2xl leading-none text-espresso-800">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-espresso-800/45">{hint}</p>
    </div>
  );
}
