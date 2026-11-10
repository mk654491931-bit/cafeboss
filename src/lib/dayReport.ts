import { formatPrice } from "./format";
import {
  dateKey,
  shiftDateKey,
  type Sale,
  type TableSection,
} from "./kasa";

export type ChangeDirection = "up" | "down" | "flat" | "new";

export interface RevenueChange {
  current: number;
  previous: number;
  difference: number;
  /** Önceki gün ciro yoksa yüzde hesaplanamaz. */
  percent: number | null;
  direction: ChangeDirection;
}

export interface SectionStat {
  section: TableSection;
  count: number;
  revenue: number;
  share: number;
}

export interface ProductStat {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

export interface CategoryStat {
  category: string;
  quantity: number;
  revenue: number;
  share: number;
}

export interface HourStat {
  hour: number;
  count: number;
  revenue: number;
}

export interface DayReportData {
  date: string;
  previousDate: string;
  sales: Sale[];
  previousSales: Sale[];
  revenue: number;
  previousRevenue: number;
  change: RevenueChange;
  itemCount: number;
  previousItemCount: number;
  average: number;
  cashTotal: number;
  cardTotal: number;
  cashCount: number;
  cardCount: number;
  sections: SectionStat[];
  products: ProductStat[];
  categories: CategoryStat[];
  hourly: HourStat[];
}

const reportDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const percentFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatReportDate(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return reportDateFormatter.format(
    new Date(year, (month ?? 1) - 1, day ?? 1),
  );
}

export function saleItemCount(sale: Sale): number {
  return sale.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function saleSummary(sale: Sale): string {
  return sale.lines
    .map((line) => `${line.quantity}× ${line.name}`)
    .join(", ");
}

export function compareRevenue(
  current: number,
  previous: number,
): RevenueChange {
  const difference = current - previous;
  const percent =
    previous > 0
      ? (difference / previous) * 100
      : current > 0
        ? null
        : 0;
  const direction: ChangeDirection =
    previous === 0
      ? current > 0
        ? "new"
        : "flat"
      : difference > 0
        ? "up"
        : difference < 0
          ? "down"
          : "flat";

  return { current, previous, difference, percent, direction };
}

export function formatPercentChange(change: RevenueChange): string {
  if (change.percent === null) return "Yeni";
  const rounded = Math.abs(change.percent) < 0.05 ? 0 : change.percent;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}%${percentFormatter.format(Math.abs(rounded))}`;
}

export function formatSignedPrice(value: number): string {
  if (value === 0) return formatPrice(0);
  return `${value > 0 ? "+" : "−"}${formatPrice(Math.abs(value))}`;
}

export function formatChangeCaption(change: RevenueChange): string {
  if (change.direction === "new") {
    return "Dün ciro yok; yüzde hesaplanamıyor";
  }
  if (change.direction === "up") return "Düne göre artış";
  if (change.direction === "down") return "Düne göre düşüş";
  return "Düne göre değişim yok";
}

export function buildDayReportData(
  allSales: Sale[],
  selectedDate: string,
): DayReportData {
  const sales = allSales
    .filter((sale) => dateKey(sale.closedAt) === selectedDate)
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt));

  const previousDate = shiftDateKey(selectedDate, -1);
  const previousSales = allSales
    .filter((sale) => dateKey(sale.closedAt) === previousDate)
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt));

  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const previousRevenue = previousSales.reduce(
    (sum, sale) => sum + sale.total,
    0,
  );
  const itemCount = sales.reduce((sum, sale) => sum + saleItemCount(sale), 0);
  const previousItemCount = previousSales.reduce(
    (sum, sale) => sum + saleItemCount(sale),
    0,
  );
  const cashSales = sales.filter((sale) => sale.paymentMethod !== "card");
  const cardSales = sales.filter((sale) => sale.paymentMethod === "card");
  const cashTotal = cashSales.reduce((sum, sale) => sum + sale.total, 0);
  const cardTotal = cardSales.reduce((sum, sale) => sum + sale.total, 0);
  const average = sales.length > 0 ? revenue / sales.length : 0;

  const sections = (["cafe", "okey"] as const).map((section) => {
    const rows = sales.filter((sale) => sale.section === section);
    const sectionRevenue = rows.reduce((sum, sale) => sum + sale.total, 0);
    return {
      section,
      count: rows.length,
      revenue: sectionRevenue,
      share: revenue > 0 ? (sectionRevenue / revenue) * 100 : 0,
    };
  });

  const categoryMap = new Map<
    string,
    { category: string; quantity: number; revenue: number }
  >();
  const productMap = new Map<string, ProductStat>();

  for (const sale of sales) {
    for (const line of sale.lines) {
      const lineRevenue = line.price * line.quantity;

      const category = categoryMap.get(line.category) ?? {
        category: line.category,
        quantity: 0,
        revenue: 0,
      };
      category.quantity += line.quantity;
      category.revenue += lineRevenue;
      categoryMap.set(line.category, category);

      const key = `${line.category}\u0000${line.name}`;
      const product = productMap.get(key) ?? {
        name: line.name,
        category: line.category,
        quantity: 0,
        revenue: 0,
      };
      product.quantity += line.quantity;
      product.revenue += lineRevenue;
      productMap.set(key, product);
    }
  }

  const categories = Array.from(categoryMap.values())
    .map((category) => ({
      ...category,
      share: revenue > 0 ? (category.revenue / revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || a.category.localeCompare(b.category));

  const products = Array.from(productMap.values()).sort(
    (a, b) =>
      b.quantity - a.quantity ||
      b.revenue - a.revenue ||
      a.name.localeCompare(b.name, "tr"),
  );

  const hourly: HourStat[] = Array.from({ length: 24 }, (_, hour) => {
    const rows = sales.filter(
      (sale) => new Date(sale.closedAt).getHours() === hour,
    );
    return {
      hour,
      count: rows.length,
      revenue: rows.reduce((sum, sale) => sum + sale.total, 0),
    };
  });

  return {
    date: selectedDate,
    previousDate,
    sales,
    previousSales,
    revenue,
    previousRevenue,
    change: compareRevenue(revenue, previousRevenue),
    itemCount,
    previousItemCount,
    average,
    cashTotal,
    cardTotal,
    cashCount: cashSales.length,
    cardCount: cardSales.length,
    sections,
    products,
    categories,
    hourly,
  };
}
