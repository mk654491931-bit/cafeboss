import type { Product } from "./types";

export type TableSection = "cafe" | "okey";
export type PaymentMethod = "cash" | "card";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Nakit",
  card: "Kart",
};

export interface CafeTable {
  id: string;
  label: string;
  section: TableSection;
  createdAt: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  addedAt: string;
}

export interface TableOrder {
  tableId: string;
  openedAt: string;
  lines: OrderLine[];
}

export interface SaleLine {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  tableId: string;
  tableLabel: string;
  section: TableSection;
  lines: SaleLine[];
  total: number;
  paymentMethod?: PaymentMethod;
  closedAt: string;
  /** İlk ürünün adisyona eklendiği an; eski satışlarda bulunmaz. */
  openedAt?: string;
}

export interface KasaSummary {
  allRevenue: number;
  allCount: number;
  todayRevenue: number;
  todayCount: number;
}

export interface KasaState {
  tables: CafeTable[];
  orders: Record<string, TableOrder>;
  sales: Sale[];
}

const STORAGE_KEY = "boss-cafe-kasa-v1";

export const SECTION_LABELS: Record<TableSection, string> = {
  cafe: "Kafe",
  okey: "Okey Salonu",
};

/**
 * Supabase menüsüne ulaşılamadığında sipariş ekranını çalışır tutan örnek
 * menü. Masa/adisyon kayıtlarının aksine hiçbir zaman kaydedilmez.
 */
const DEMO_MENU_ITEMS: Product[] = [
  {
    id: "demo-turk-kahvesi",
    name: "Türk Kahvesi",
    category: "Sıcak Kahveler",
    price: 60,
    description: "Bakır cezvede, köpüğü bol.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-espresso",
    name: "Espresso",
    category: "Sıcak Kahveler",
    price: 55,
    description: "Yoğun ve kısa.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-latte",
    name: "Latte",
    category: "Sıcak Kahveler",
    price: 95,
    description: "Kadifemsi süt köpüğüyle.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-cappuccino",
    name: "Cappuccino",
    category: "Sıcak Kahveler",
    price: 95,
    description: "Bol köpüklü klasik.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-filtre",
    name: "Filtre Kahve",
    category: "Sıcak Kahveler",
    price: 80,
    description: "Günün çekirdeğinden demleme.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-sicak-cikolata",
    name: "Sıcak Çikolata",
    category: "Sıcak Kahveler",
    price: 90,
    description: "Gerçek çikolatayla.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-cay",
    name: "Çay",
    category: "Çaylar",
    price: 25,
    description: "Demlikten taze.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-ihlamur",
    name: "Ihlamur",
    category: "Çaylar",
    price: 30,
    description: "Bal ile servis edilir.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-limonata",
    name: "Limonata",
    category: "Soğuk İçecekler",
    price: 60,
    description: "Taze sıkılmış.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-ice-latte",
    name: "Ice Latte",
    category: "Soğuk Kahveler",
    price: 100,
    description: "Buz gibi, yumuşak içim.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-cold-brew",
    name: "Cold Brew",
    category: "Soğuk Kahveler",
    price: 105,
    description: "12 saat soğuk demleme.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-tost",
    name: "Karışık Tost",
    category: "Yiyecekler",
    price: 85,
    description: "Kaşar, sucuk ve tereyağı.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-sufle",
    name: "Sufle",
    category: "Tatlılar",
    price: 95,
    description: "Sıcak çikolata dolgulu.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-cheesecake",
    name: "Cheesecake",
    category: "Tatlılar",
    price: 110,
    description: "Frambuazlı.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-nargile",
    name: "Nargile",
    category: "Nargile",
    price: 200,
    description: "Klasik tütün seçenekleriyle.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-ice-americano",
    name: "Ice Americano",
    category: "Soğuk Kahveler",
    price: 100,
    description: "Çift shot espresso ve buz.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-bitki-cayi",
    name: "Bitki Çayı",
    category: "Çaylar",
    price: 35,
    description: "Nane-limon ve adaçayı seçenekleri.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-kasarli-tost",
    name: "Kaşarlı Tost",
    category: "Yiyecekler",
    price: 75,
    description: "Bol kaşar, tereyağlı çıtır ekmek.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-tavuk-sandvic",
    name: "Tavuk Sandviç",
    category: "Yiyecekler",
    price: 120,
    description: "Izgara tavuk, yeşillik ve özel sos.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-hamburger",
    name: "Hamburger",
    category: "Yiyecekler",
    price: 165,
    description: "Dana köfte, cheddar ve karamelize soğan.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-patates",
    name: "Patates Kızartması",
    category: "Yiyecekler",
    price: 70,
    description: "Baharatlı, çıtır patates.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-kahvalti",
    name: "Kahvaltı Tabağı",
    category: "Yiyecekler",
    price: 180,
    description: "Peynir, zeytin, yumurta ve sıcak ekmek.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-pizza",
    name: "Margarita Pizza",
    category: "Yiyecekler",
    price: 150,
    description: "İnce hamur, domates sosu ve mozzarella.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-brownie",
    name: "Brownie",
    category: "Tatlılar",
    price: 105,
    description: "Sıcak çikolata sosuyla.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-portakal",
    name: "Portakal Suyu",
    category: "Soğuk İçecekler",
    price: 65,
    description: "Taze sıkılmış.",
    image_url: null,
    is_available: true,
  },
  {
    id: "demo-ayran",
    name: "Ayran",
    category: "Soğuk İçecekler",
    price: 35,
    description: "Ev yapımı, serinletici.",
    image_url: null,
    is_available: true,
  },
];

const DEMO_MENU_PHOTOS: Record<string, string> = {
  "demo-turk-kahvesi": "/menu/turk-kahvesi.jpg",
  "demo-espresso": "/menu/espresso.jpg",
  "demo-latte": "/menu/latte.jpg",
  "demo-cappuccino": "/menu/cappuccino.jpg",
  "demo-filtre": "/menu/filtre-kahve.jpg",
  "demo-sicak-cikolata": "/menu/sicak-cikolata.jpg",
  "demo-cay": "/menu/cay.jpg",
  "demo-ihlamur": "/menu/ihlamur.jpg",
  "demo-bitki-cayi": "/menu/bitki-cayi.jpg",
  "demo-limonata": "/menu/limonata.jpg",
  "demo-portakal": "/menu/portakal.jpg",
  "demo-ayran": "/menu/ayran.jpg",
  "demo-ice-latte": "/menu/ice-latte.jpg",
  "demo-cold-brew": "/menu/cold-brew.jpg",
  "demo-ice-americano": "/menu/ice-americano.jpg",
  "demo-tost": "/menu/tost.jpg",
  "demo-kasarli-tost": "/menu/tost.jpg",
  "demo-tavuk-sandvic": "/menu/sandvic.jpg",
  "demo-hamburger": "/menu/hamburger.jpg",
  "demo-patates": "/menu/patates.jpg",
  "demo-kahvalti": "/menu/kahvalti.jpg",
  "demo-pizza": "/menu/pizza.jpg",
  "demo-sufle": "/menu/sufle.jpg",
  "demo-cheesecake": "/menu/cheesecake.jpg",
  "demo-brownie": "/menu/brownie.jpg",
  "demo-nargile": "/menu/nargile.jpg",
};

export const DEMO_MENU: Product[] = DEMO_MENU_ITEMS.map((product) => ({
  ...product,
  image_url: DEMO_MENU_PHOTOS[product.id] ?? product.image_url,
}));

export function createInitialKasaState(): KasaState {
  const createdAt = new Date().toISOString();
  const tables: CafeTable[] = (
    ["cafe", "okey"] as const
  ).flatMap((section) =>
    Array.from({ length: 8 }, (_, index) => ({
      id: `${section}-${index + 1}`,
      label: `Masa ${index + 1}`,
      section,
      createdAt,
    })),
  );

  return { tables, orders: {}, sales: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSection(value: unknown): value is TableSection {
  return value === "cafe" || value === "okey";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTable(value: unknown): value is CafeTable {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isSection(value.section) &&
    typeof value.createdAt === "string"
  );
}

function isSaleLine(value: unknown): value is SaleLine {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.quantity)
  );
}

function isSale(value: unknown): value is Sale {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.tableId === "string" &&
    typeof value.tableLabel === "string" &&
    isSection(value.section) &&
    Array.isArray(value.lines) &&
    value.lines.every(isSaleLine) &&
    isFiniteNumber(value.total) &&
    (value.paymentMethod === undefined ||
      value.paymentMethod === "cash" ||
      value.paymentMethod === "card") &&
    typeof value.closedAt === "string" &&
    (value.openedAt === undefined || typeof value.openedAt === "string")
  );
}

function isOrderLine(value: unknown): value is OrderLine {
  if (!isRecord(value)) return false;
  return (
    typeof value.productId === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.quantity) &&
    typeof value.addedAt === "string"
  );
}

function isTableOrder(value: unknown): value is TableOrder {
  if (!isRecord(value)) return false;
  return (
    typeof value.tableId === "string" &&
    typeof value.openedAt === "string" &&
    Array.isArray(value.lines) &&
    value.lines.every(isOrderLine)
  );
}

/** Kalıcı kaydı okur; bozuk ya da eksik veride başlangıç haritasına döner. */
export function loadKasaState(): KasaState {
  if (typeof window === "undefined") return createInitialKasaState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialKasaState();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return createInitialKasaState();

    if (!Array.isArray(parsed.tables)) return createInitialKasaState();

    const tables = parsed.tables.filter(isTable);
    const sales = Array.isArray(parsed.sales)
      ? parsed.sales.filter(isSale)
      : [];

    const tableIds = new Set(tables.map((table) => table.id));
    const orders: Record<string, TableOrder> = {};
    if (isRecord(parsed.orders)) {
      for (const [tableId, value] of Object.entries(parsed.orders)) {
        if (
          tableIds.has(tableId) &&
          isTableOrder(value) &&
          value.tableId === tableId &&
          value.lines.length > 0
        ) {
          orders[tableId] = value;
        }
      }
    }

    return { tables, orders, sales };
  } catch {
    return createInitialKasaState();
  }
}

export function saveKasaState(state: KasaState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Depolama dolu ya da kapalı olabilir; oturum boyunca bellekte çalışmaya devam et.
  }
}

export function createKasaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sectionLabel(section: TableSection): string {
  return SECTION_LABELS[section];
}

/** Eski kayıtlarda ödeme tipi yoksa nakit kabul edilir. */
export function paymentLabel(method: PaymentMethod | undefined): string {
  return method === "card" ? PAYMENT_LABELS.card : PAYMENT_LABELS.cash;
}

/** Yeni ürünü adisyona ekler; aynı ürün varsa adedini artırır. */
export function addItemToKasaState(
  state: KasaState,
  tableId: string,
  product: Product,
  addedAt = new Date().toISOString(),
): KasaState {
  if (!state.tables.some((table) => table.id === tableId)) return state;

  const order = state.orders[tableId];
  let lines: OrderLine[];

  if (!order) {
    lines = [
      {
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: 1,
        addedAt,
      },
    ];
  } else {
    const existing = order.lines.find(
      (line) => line.productId === product.id,
    );
    lines = existing
      ? order.lines.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      : [
          ...order.lines,
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: 1,
            addedAt,
          },
        ];
  }

  return {
    ...state,
    orders: {
      ...state.orders,
      [tableId]: {
        tableId,
        openedAt: order?.openedAt ?? addedAt,
        lines,
      },
    },
  };
}

/** Adet artırır/azaltır; sıfıra düşen satırı kaldırır. */
export function changeKasaItemQuantity(
  state: KasaState,
  tableId: string,
  productId: string,
  delta: number,
): KasaState {
  const order = state.orders[tableId];
  if (!order || delta === 0) return state;

  const lines = order.lines
    .map((line) =>
      line.productId === productId
        ? { ...line, quantity: line.quantity + delta }
        : line,
    )
    .filter((line) => line.quantity > 0);

  const orders = { ...state.orders };
  if (lines.length === 0) {
    delete orders[tableId];
  } else {
    orders[tableId] = { ...order, lines };
  }

  return { ...state, orders };
}

/** Bir ürün satırını adisyondan tamamen kaldırır. */
export function removeKasaOrderLine(
  state: KasaState,
  tableId: string,
  productId: string,
): KasaState {
  const order = state.orders[tableId];
  if (!order) return state;

  const lines = order.lines.filter((line) => line.productId !== productId);
  const orders = { ...state.orders };
  if (lines.length === 0) {
    delete orders[tableId];
  } else {
    orders[tableId] = { ...order, lines };
  }

  return { ...state, orders };
}

export function orderTotal(order: TableOrder | undefined): number {
  if (!order) return 0;
  return order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function orderItemCount(order: TableOrder | undefined): number {
  if (!order) return 0;
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function nextTableLabel(
  tables: CafeTable[],
  section: TableSection,
): string {
  let highest = 0;
  for (const table of tables) {
    if (table.section !== section) continue;
    const match = table.label.match(/(\d+)\s*$/);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `Masa ${highest + 1}`;
}

export function dateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function shiftDateKey(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/** Yerel günün başlangıç ve bitişini Supabase sorgusu için ISO'ya çevirir. */
export function dayBounds(key: string): { start: string; end: string } {
  return {
    start: dateFromKey(key).toISOString(),
    end: dateFromKey(shiftDateKey(key, 1)).toISOString(),
  };
}

/** Yerel kasa kayıtlarından genel ve günlük özet çıkarır. */
export function buildKasaSummary(
  sales: Sale[],
  selectedDate: string,
): KasaSummary {
  let allRevenue = 0;
  let todayRevenue = 0;
  let todayCount = 0;

  for (const sale of sales) {
    allRevenue += sale.total;
    if (dateKey(sale.closedAt) === selectedDate) {
      todayRevenue += sale.total;
      todayCount += 1;
    }
  }

  return {
    allRevenue,
    allCount: sales.length,
    todayRevenue,
    todayCount,
  };
}
