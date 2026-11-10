import type { SupabaseClient } from "@supabase/supabase-js";
import { toTurkishError } from "./errors";
import { authenticatedClient } from "./supabase";
import type {
  CafeTable,
  KasaSummary,
  KasaState,
  PaymentMethod,
  Sale,
  SaleLine,
  TableOrder,
  TableSection,
} from "./kasa";

export const KASA_SETUP_MESSAGE =
  "Kasa tabloları Supabase'de henüz kurulmadı. supabase/schema.sql dosyasını Supabase SQL Editor'de çalıştırın; ardından bu sayfayı yenileyin.";

const SALES_PAGE_SIZE = 500;

interface TableRow {
  id: string;
  label: string;
  section: string;
  created_at: string;
}

interface ItemRow {
  product_id: string;
  name: string;
  category: string;
  price: number | string;
  quantity: number;
  added_at: string;
  position?: number;
}

interface OrderRow {
  table_id: string;
  opened_at: string;
  order_items: ItemRow[] | null;
}

interface SaleRow {
  id: string;
  table_id: string;
  table_label: string;
  section: string;
  total: number | string;
  payment_method: string;
  closed_at: string;
  opened_at?: string | null;
  sale_items: ItemRow[] | null;
}

interface SummaryRow {
  all_revenue: number | string | null;
  all_count: number | string | null;
  day_revenue: number | string | null;
  day_count: number | string | null;
}

const TABLE_COLUMNS = "id, label, section, created_at";
const ORDER_COLUMNS =
  "table_id, opened_at, order_items(product_id, name, category, price, quantity, added_at)";
// `*` kullanılıyor: opened_at kolonu (migration) henüz eklenmemişse sorgu
// bozulmasın, eski satışlarda geliş saati "—" olarak gösterilsin.
const SALE_COLUMNS = "*, sale_items(name, category, price, quantity, position)";

function readMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return typeof error === "string" ? error : "";
}

export function isMissingKasaSchema(error: unknown): boolean {
  const lower = readMessage(error).toLowerCase();
  return (
    lower.includes("pgrst205") ||
    lower.includes("could not find the table") ||
    lower.includes("relation \"public.cafe_tables\" does not exist") ||
    lower.includes("relation \"public.table_orders\" does not exist") ||
    lower.includes("relation \"public.order_items\" does not exist") ||
    lower.includes("relation \"public.sales\" does not exist") ||
    lower.includes("relation \"public.sale_items\" does not exist")
  );
}

/** Supabase hata mesajlarını kasadaki kullanıcıya anlaşılır biçimde gösterir. */
export function kasaError(error: unknown): string {
  if (isMissingKasaSchema(error)) return KASA_SETUP_MESSAGE;

  const message = readMessage(error);
  const known: Array<[string, string]> = [
    ["table_not_found", "Masa bulunamadı."],
    ["product_not_found", "Ürün menüde bulunamadı; menüyü yenileyin."],
    ["product_unavailable", "Bu ürün şu anda tükendi."],
    ["item_not_found", "Adisyon satırı bulunamadı; sayfayı yenileyin."],
    ["order_empty", "Bu masada kapatılacak açık hesap yok."],
    ["table_open", "Açık hesabı olan masa kaldırılamaz. Önce hesabı kapatın."],
    ["invalid_quantity", "Ürün adedi geçersiz."],
    ["invalid_payment_method", "Geçersiz ödeme yöntemi."],
    [
      "cafe_tables_section_label_unique",
      "Bu bölümde aynı isimde bir masa var.",
    ],
  ];

  for (const [needle, text] of known) {
    if (message.includes(needle)) return text;
  }

  return toTurkishError(error);
}

function sectionOf(value: string): TableSection {
  return value === "okey" ? "okey" : "cafe";
}

function paymentOf(value: string): PaymentMethod {
  return value === "card" ? "card" : "cash";
}

function mapTable(row: TableRow): CafeTable {
  return {
    id: row.id,
    label: row.label,
    section: sectionOf(row.section),
    createdAt: row.created_at,
  };
}

function mapOrder(row: OrderRow): TableOrder | null {
  const lines = (row.order_items ?? []).map((line) => ({
    productId: line.product_id,
    name: line.name,
    category: line.category,
    price: Number(line.price),
    quantity: line.quantity,
    addedAt: line.added_at,
  }));

  if (lines.length === 0) return null;

  return {
    tableId: row.table_id,
    openedAt: row.opened_at,
    lines,
  };
}

function mapSale(row: SaleRow): Sale {
  const lines: SaleLine[] = [...(row.sale_items ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((line) => ({
      name: line.name,
      category: line.category,
      price: Number(line.price),
      quantity: line.quantity,
    }));

  return {
    id: row.id,
    tableId: row.table_id,
    tableLabel: row.table_label,
    section: sectionOf(row.section),
    lines,
    total: Number(row.total),
    paymentMethod: paymentOf(row.payment_method),
    closedAt: row.closed_at,
    openedAt: row.opened_at ?? undefined,
  };
}

async function fetchWorkspaceFrom(
  db: SupabaseClient,
): Promise<Pick<KasaState, "tables" | "orders">> {
  const [tablesResult, ordersResult] = await Promise.all([
    db.from("cafe_tables").select(TABLE_COLUMNS),
    db
      .from("table_orders")
      .select(ORDER_COLUMNS)
      .order("added_at", {
        referencedTable: "order_items",
        ascending: true,
      }),
  ]);

  if (tablesResult.error) throw tablesResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const tables = ((tablesResult.data ?? []) as TableRow[]).map(mapTable);
  const tableIds = new Set(tables.map((table) => table.id));

  const orders: Record<string, TableOrder> = {};
  for (const row of (ordersResult.data ?? []) as OrderRow[]) {
    if (!tableIds.has(row.table_id)) continue;
    const order = mapOrder(row);
    if (order) orders[row.table_id] = order;
  }

  return { tables, orders };
}

/** Masalar ve açık adisyonlar; sık yenilenen küçük kasa verisi. */
export async function fetchKasaWorkspace(): Promise<
  Pick<KasaState, "tables" | "orders">
> {
  const db = await authenticatedClient();
  return fetchWorkspaceFrom(db);
}

/**
 * Seçili tarih aralığındaki satışları okur. Gün sonu raporu yalnızca seçili
 * günü ve bir önceki günü ister; tüm satış geçmişi hiçbir zaman çekilmez.
 */
export async function fetchKasaSalesRange(
  startIso: string,
  endIso: string,
): Promise<Sale[]> {
  const db = await authenticatedClient();
  const rows: SaleRow[] = [];

  for (let from = 0; ; from += SALES_PAGE_SIZE) {
    const { data, error } = await db
      .from("sales")
      .select(SALE_COLUMNS)
      .gte("closed_at", startIso)
      .lt("closed_at", endIso)
      .order("closed_at", { ascending: false })
      .range(from, from + SALES_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as SaleRow[];
    rows.push(...page);
    if (page.length < SALES_PAGE_SIZE) break;
  }

  return rows.map(mapSale);
}

/**
 * Özet kartları için tüm zamanların ve seçili günün toplamını tek, küçük bir
 * RPC yanıtıyla getirir. Satış satırları istemciye taşınmaz.
 */
export async function fetchKasaSummary(
  dayStart: string,
  dayEnd: string,
): Promise<KasaSummary> {
  const db = await authenticatedClient();
  const { data, error } = await db.rpc("get_kasa_summary", {
    p_day_start: dayStart,
    p_day_end: dayEnd,
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as SummaryRow | null;
  return {
    allRevenue: Number(row?.all_revenue ?? 0),
    allCount: Number(row?.all_count ?? 0),
    todayRevenue: Number(row?.day_revenue ?? 0),
    todayCount: Number(row?.day_count ?? 0),
  };
}

export async function insertKasaTable(table: CafeTable): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.from("cafe_tables").insert({
    id: table.id,
    label: table.label,
    section: table.section,
    created_at: table.createdAt,
  });
  if (error) throw error;
}

export async function deleteKasaTable(tableId: string): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.rpc("delete_cafe_table", { p_table_id: tableId });
  if (error) throw error;
}

export async function addKasaOrderItem(
  tableId: string,
  productId: string,
): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.rpc("add_order_item", {
    p_table_id: tableId,
    p_product_id: productId,
    p_quantity: 1,
  });
  if (error) throw error;
}

export async function changeKasaOrderItemQuantity(
  tableId: string,
  productId: string,
  delta: number,
): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.rpc("change_order_item_quantity", {
    p_table_id: tableId,
    p_product_id: productId,
    p_delta: delta,
  });
  if (error) throw error;
}

export async function removeKasaOrderItem(
  tableId: string,
  productId: string,
): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.rpc("remove_order_item", {
    p_table_id: tableId,
    p_product_id: productId,
  });
  if (error) throw error;
}

export async function closeKasaTable(
  tableId: string,
  paymentMethod: PaymentMethod,
): Promise<void> {
  const db = await authenticatedClient();
  const { error } = await db.rpc("close_kasa_table", {
    p_table_id: tableId,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
}
