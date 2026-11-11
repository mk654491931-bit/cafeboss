import { formatPrice } from "./format";
import {
  paymentLabel,
  sectionLabel,
  type PaymentMethod,
  type TableSection,
} from "./kasa";

export interface ReceiptLine {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  tableLabel: string;
  section: TableSection;
  lines: ReceiptLine[];
  total: number;
  paymentMethod?: PaymentMethod;
  closedAt?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function receiptDateTime(closedAt?: string): string {
  const date = closedAt ? new Date(closedAt) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

/**
 * Fişi bağımsız bir HTML belgesi olarak üretir. Tüm kullanıcı metinleri
 * kaçırılır; yazdırma penceresine ham HTML enjekte edilmez.
 */
export function buildReceiptHtml(data: ReceiptData): string {
  const paid = Boolean(data.closedAt);
  const title = paid ? "FİŞ" : "ÖN HESAP";

  const linesHtml = data.lines
    .map(
      (line) => `<tr>
        <td class="qty">${line.quantity}×</td>
        <td class="name">${escapeHtml(line.name)}</td>
        <td class="right">${escapeHtml(
          formatPrice(line.price * line.quantity),
        )}</td>
      </tr>`,
    )
    .join("");

  const paymentRow = paid
    ? `<div class="row"><span>Ödeme</span><span>${escapeHtml(
        paymentLabel(data.paymentMethod),
      )}</span></div>`
    : "";

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} · ${escapeHtml(data.tableLabel)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #111;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 12px;
  }
  body { width: 72mm; margin: 0 auto; padding: 2mm 0; }
  .brand { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: 0.08em; }
  .brand-sub { text-align: center; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #555; margin-top: 2px; }
  .contact { text-align: center; font-size: 10px; line-height: 1.5; color: #444; margin-top: 5px; }
  .divider { border-top: 1px dashed #888; margin: 8px 0; }
  .receipt-title { text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; margin-bottom: 6px; }
  .row { display: flex; justify-content: space-between; gap: 8px; line-height: 1.6; }
  .muted { color: #555; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; font-size: 12px; }
  td.qty { width: 22px; white-space: nowrap; }
  td.name { word-break: break-word; }
  td.right { text-align: right; white-space: nowrap; padding-left: 6px; }
  .total { display: flex; justify-content: space-between; gap: 8px; font-size: 17px; font-weight: 700; margin-top: 2px; }
  .footer { text-align: center; font-size: 10px; line-height: 1.6; color: #444; margin-top: 10px; }
</style>
</head>
<body>
  <div class="brand">BOSS CAFE</div>
  <div class="brand-sub">Kahve · Okey · Keyif</div>
  <div class="contact">Eleşkirt / Ağrı<br />+90 531 346 77 30</div>
  <div class="divider"></div>
  <div class="receipt-title">${title}</div>
  <div class="row"><span>Masa</span><span>${escapeHtml(
    data.tableLabel,
  )}</span></div>
  <div class="row"><span>Bölüm</span><span>${escapeHtml(
    sectionLabel(data.section),
  )}</span></div>
  <div class="row"><span>Tarih</span><span>${escapeHtml(
    receiptDateTime(data.closedAt),
  )}</span></div>
  <div class="divider"></div>
  <table>${linesHtml}</table>
  <div class="divider"></div>
  <div class="total"><span>TOPLAM</span><span>${escapeHtml(
    formatPrice(data.total),
  )}</span></div>
  ${paymentRow}
  <div class="divider"></div>
  <div class="footer">Bizi tercih ettiğiniz için teşekkür ederiz.<br />Afiyet olsun!</div>
</body>
</html>`;
}

/**
 * Fişi görünmez bir iframe içinde yazdırır; popup engelleyicilerden etkilenmez
 * ve uygulama sayfasının geri kalanını yazdırmaz.
 */
export function printBillReceipt(data: ReceiptData): boolean {
  if (typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:80mm;height:100mm;border:0;";

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    iframe.remove();
    return false;
  }

  const doc = frameWindow.document;
  doc.open();
  doc.write(buildReceiptHtml(data));
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  frameWindow.onafterprint = cleanup;

  frameWindow.setTimeout(() => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      cleanup();
    }
  }, 200);

  window.setTimeout(cleanup, 60000);
  return true;
}
