import { jsPDF } from "jspdf";
import { formatPrice } from "./format";
import {
  formatChangeCaption,
  formatPercentChange,
  formatReportDate,
  formatSignedPrice,
  saleItemCount,
  saleSummary,
  type CategoryStat,
  type DayReportData,
  type ProductStat,
  type RevenueChange,
} from "./dayReport";
import { paymentLabel, sectionLabel, type Sale } from "./kasa";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_LINE_Y = 282;
const TOTAL_PAGES = 3;

type RGB = [number, number, number];

const INK: RGB = [26, 22, 20];
const ESPRESSO: RGB = [42, 28, 19];
const ESPRESSO_SOFT: RGB = [92, 58, 42];
const CARAMEL: RGB = [192, 133, 82];
const CREAM: RGB = [246, 239, 229];
const PAPER: RGB = [253, 251, 247];
const WHITE: RGB = [255, 255, 255];
const MUTED: RGB = [116, 99, 87];
const LINE: RGB = [224, 213, 200];
const GREEN: RGB = [49, 92, 76];
const GREEN_BG: RGB = [228, 238, 233];
const RED: RGB = [156, 59, 44];
const RED_BG: RGB = [247, 230, 226];
const CARAMEL_BG: RGB = [244, 232, 219];

export interface DayReportPdfFonts {
  regular: string;
  bold: string;
}

export interface DayReportPdfOptions {
  fonts: DayReportPdfFonts;
  generatedAt?: Date;
}

const FONT_PATHS = {
  regular: "/fonts/NotoSans-Regular.ttf",
  bold: "/fonts/NotoSans-Bold.ttf",
};

let fontsPromise: Promise<DayReportPdfFonts> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchFontBase64(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`PDF fontu yüklenemedi (${response.status}).`);
  }
  return arrayBufferToBase64(await response.arrayBuffer());
}

export function loadDayReportFonts(): Promise<DayReportPdfFonts> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFontBase64(FONT_PATHS.regular),
      fetchFontBase64(FONT_PATHS.bold),
    ])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((error: unknown) => {
        fontsPromise = null;
        throw error;
      });
  }
  return fontsPromise;
}

function setFill(doc: jsPDF, color: RGB): void {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setStroke(doc: jsPDF, color: RGB): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}

interface TextOptions {
  font?: "normal" | "bold";
  size?: number;
  color?: RGB;
  align?: "left" | "center" | "right";
  charSpace?: number;
}

function drawText(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  options: TextOptions = {},
): void {
  const {
    font = "normal",
    size = 8,
    color = INK,
    align = "left",
    charSpace = 0,
  } = options;
  doc.setFont("NotoSans", font);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setCharSpace(charSpace);
  doc.text(value, x, y, { align });
  doc.setCharSpace(0);
}

function drawRule(doc: jsPDF, y: number, color = LINE): void {
  setStroke(doc, color);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
}

function drawPageHeader(
  doc: jsPDF,
  page: number,
  title: string,
  data: DayReportData,
): void {
  drawText(doc, "BOSS CAFE", MARGIN, 18, {
    font: "bold",
    size: 13,
    color: ESPRESSO,
    charSpace: 0.55,
  });
  drawText(doc, "GÜN SONU RAPORU", MARGIN, 23.5, {
    font: "bold",
    size: 6.8,
    color: CARAMEL,
    charSpace: 0.4,
  });
  drawText(doc, formatReportDate(data.date), PAGE_WIDTH - MARGIN, 18, {
    size: 8.2,
    color: ESPRESSO_SOFT,
    align: "right",
  });
  drawText(
    doc,
    `SAYFA ${page} / ${TOTAL_PAGES} · ${title.toLocaleUpperCase("tr-TR")}`,
    PAGE_WIDTH - MARGIN,
    23.5,
    {
      size: 6.2,
      color: MUTED,
      align: "right",
      charSpace: 0.25,
    },
  );
  drawRule(doc, 29);
}

function drawFooter(
  doc: jsPDF,
  generatedAt: Date,
  reportDate: string,
): void {
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawRule(doc, FOOTER_LINE_Y);
    drawText(
      doc,
      `Boss Cafe · ${formatReportDate(reportDate)}`,
      MARGIN,
      287,
      { size: 6.3, color: MUTED },
    );
    drawText(
      doc,
      `Oluşturulma: ${generatedAt.toLocaleString("tr-TR")}`,
      PAGE_WIDTH / 2,
      287,
      { size: 6.3, color: MUTED, align: "center" },
    );
    drawText(doc, `Sayfa ${page} / ${totalPages}`, PAGE_WIDTH - MARGIN, 287, {
      size: 6.3,
      color: MUTED,
      align: "right",
    });
  }
}

function changeColors(change: RevenueChange): {
  text: RGB;
  background: RGB;
} {
  if (change.direction === "down") {
    return { text: RED, background: RED_BG };
  }
  if (change.direction === "up" || change.direction === "new") {
    return { text: GREEN, background: GREEN_BG };
  }
  return { text: ESPRESSO_SOFT, background: CARAMEL_BG };
}

function fitText(
  doc: jsPDF,
  value: string,
  maxWidth: number,
  font: "normal" | "bold" = "normal",
  size = 7,
): string {
  doc.setFont("NotoSans", font);
  doc.setFontSize(size);
  if (doc.getTextWidth(value) <= maxWidth) return value;

  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (doc.getTextWidth(`${value.slice(0, middle)}…`) <= maxWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return `${value.slice(0, low).trimEnd()}…`;
}

function drawPill(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  background: RGB,
  color: RGB,
): void {
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(7.2);
  const width = doc.getTextWidth(label) + 7;
  setFill(doc, background);
  doc.roundedRect(x, y, width, 8, 2.2, 2.2, "F");
  drawText(doc, label, x + width / 2, y + 5.2, {
    font: "bold",
    size: 7.2,
    color,
    align: "center",
  });
}

function drawSummaryCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  hint: string,
  accent = false,
): void {
  setFill(doc, accent ? CARAMEL_BG : WHITE);
  setStroke(doc, accent ? [226, 195, 164] : LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, 27, 3, 3, "FD");
  drawText(doc, label.toLocaleUpperCase("tr-TR"), x + 4, y + 7, {
    font: "bold",
    size: 5.8,
    color: MUTED,
    charSpace: 0.22,
  });
  drawText(doc, value, x + 4, y + 16.5, {
    font: "bold",
    size: 11.5,
    color: ESPRESSO,
  });
  drawText(doc, hint, x + 4, y + 23, {
    size: 6.2,
    color: MUTED,
  });
}

function drawHero(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 34;
  const width = CONTENT_WIDTH;
  const height = 60;
  setFill(doc, ESPRESSO);
  doc.roundedRect(x, y, width, height, 4, 4, "F");

  drawText(doc, "SEÇİLİ GÜNÜN CİROSU", x + 8, y + 12, {
    font: "bold",
    size: 6.8,
    color: CARAMEL,
    charSpace: 0.45,
  });
  drawText(doc, formatPrice(data.revenue), x + 8, y + 29, {
    font: "bold",
    size: 26,
    color: CREAM,
  });

  const colors = changeColors(data.change);
  const changeLabel = formatPercentChange(data.change);
  drawPill(
    doc,
    x + 8,
    y + 34,
    `${changeLabel}  ·  ${formatSignedPrice(data.change.difference)}`,
    colors.background,
    colors.text,
  );
  drawText(
    doc,
    `Dün: ${formatPrice(data.previousRevenue)} · ${formatChangeCaption(
      data.change,
    )}`,
    x + 8,
    y + 50,
    { size: 7, color: [209, 195, 184] },
  );

  setStroke(doc, [91, 69, 55]);
  doc.setLineWidth(0.3);
  doc.line(x + 123, y + 10, x + 123, y + 50);

  drawText(doc, "KAPANAN HESAP", x + width - 8, y + 13, {
    font: "bold",
    size: 6,
    color: [190, 173, 160],
    align: "right",
    charSpace: 0.25,
  });
  drawText(doc, String(data.sales.length), x + width - 8, y + 23, {
    font: "bold",
    size: 16,
    color: CREAM,
    align: "right",
  });
  drawText(doc, "SATILAN ÜRÜN", x + width - 8, y + 33, {
    font: "bold",
    size: 6,
    color: [190, 173, 160],
    align: "right",
    charSpace: 0.25,
  });
  drawText(doc, String(data.itemCount), x + width - 8, y + 43, {
    font: "bold",
    size: 16,
    color: CREAM,
    align: "right",
  });
}

function drawComparison(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 100;
  const width = CONTENT_WIDTH;
  setFill(doc, WHITE);
  setStroke(doc, LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, 34, 3, 3, "FD");

  drawText(doc, "BİR ÖNCEKİ GÜNE GÖRE CİRO DEĞİŞİMİ", x + 6, y + 9, {
    font: "bold",
    size: 6.4,
    color: MUTED,
    charSpace: 0.3,
  });

  const colors = changeColors(data.change);
  const columns = [
    {
      label: "DÜN",
      value: formatPrice(data.previousRevenue),
      color: ESPRESSO,
    },
    {
      label: "SEÇİLİ GÜN",
      value: formatPrice(data.revenue),
      color: ESPRESSO,
    },
    {
      label: "FARK",
      value: formatSignedPrice(data.change.difference),
      color: colors.text,
    },
    {
      label: "DEĞİŞİM",
      value: formatPercentChange(data.change),
      color: colors.text,
    },
  ];

  columns.forEach((column, index) => {
    const columnX = x + 6 + index * 44;
    if (index > 0) {
      setStroke(doc, LINE);
      doc.line(columnX - 5, y + 14, columnX - 5, y + 29);
    }
    drawText(doc, column.label, columnX, y + 18, {
      font: "bold",
      size: 5.8,
      color: MUTED,
      charSpace: 0.2,
    });
    drawText(doc, column.value, columnX, y + 26, {
      font: "bold",
      size: 11,
      color: column.color,
    });
  });
}

function drawSectionDistribution(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 176;
  const width = CONTENT_WIDTH;
  const height = 48;
  setFill(doc, WHITE);
  setStroke(doc, LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  drawText(doc, "BÖLÜM DAĞILIMI", x + 6, y + 9, {
    font: "bold",
    size: 6.4,
    color: MUTED,
    charSpace: 0.3,
  });

  data.sections.forEach((section, index) => {
    const rowY = y + 18 + index * 13;
    drawText(doc, sectionLabel(section.section), x + 6, rowY, {
      font: "bold",
      size: 8,
      color: ESPRESSO,
    });
    drawText(doc, formatPrice(section.revenue), x + width - 6, rowY, {
      font: "bold",
      size: 8,
      color: ESPRESSO,
      align: "right",
    });

    const barWidth = width - 12;
    setFill(doc, CREAM);
    doc.roundedRect(x + 6, rowY + 3, barWidth, 2.2, 1, 1, "F");
    if (section.share > 0) {
      setFill(doc, section.section === "okey" ? GREEN : CARAMEL);
      doc.roundedRect(
        x + 6,
        rowY + 3,
        Math.max(1.2, (barWidth * section.share) / 100),
        2.2,
        1,
        1,
        "F",
      );
    }
    drawText(
      doc,
      `${section.count} hesap · ciro payı %${section.share.toFixed(1).replace(".", ",")}`,
      x + 6,
      rowY + 9,
      { size: 6.2, color: MUTED },
    );
  });
}

function drawHourlyChart(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 230;
  const width = CONTENT_WIDTH;
  const height = 42;
  setFill(doc, WHITE);
  setStroke(doc, LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  drawText(doc, "SAATLİK CİRO DAĞILIMI", x + 6, y + 8.5, {
    font: "bold",
    size: 6.4,
    color: MUTED,
    charSpace: 0.3,
  });

  const maxRevenue = Math.max(...data.hourly.map((hour) => hour.revenue), 0);
  const chartX = x + 6;
  const chartY = y + 14;
  const chartWidth = width - 12;
  const chartHeight = 19;
  const gap = 1.15;
  const barWidth = (chartWidth - gap * 23) / 24;

  setStroke(doc, LINE);
  doc.setLineWidth(0.25);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  data.hourly.forEach((hour, index) => {
    const barHeight =
      maxRevenue > 0 ? (hour.revenue / maxRevenue) * chartHeight : 0;
    const barX = chartX + index * (barWidth + gap);
    if (hour.revenue > 0) {
      setFill(doc, hour.revenue === maxRevenue ? CARAMEL : CREAM);
      doc.roundedRect(
        barX,
        chartY + chartHeight - Math.max(0.7, barHeight),
        barWidth,
        Math.max(0.7, barHeight),
        0.7,
        0.7,
        "F",
      );
    }
    if (index % 3 === 0) {
      drawText(doc, String(hour.hour).padStart(2, "0"), barX + barWidth / 2, y + 37, {
        size: 5.4,
        color: MUTED,
        align: "center",
      });
    }
  });

  drawText(
    doc,
    data.sales.length > 0 ? "En yüksek saat vurgulanmıştır" : "Bu gün satış yok",
    x + width - 6,
    y + 8.5,
    { size: 5.8, color: MUTED, align: "right" },
  );
}

function drawPageOne(doc: jsPDF, data: DayReportData): void {
  drawPageHeader(doc, 1, "Yönetici Özeti", data);
  drawHero(doc, data);
  drawComparison(doc, data);

  drawSummaryCard(
    doc,
    MARGIN,
    140,
    43,
    "Nakit Tahsilat",
    formatPrice(data.cashTotal),
    `${data.cashCount} hesap`,
  );
  drawSummaryCard(
    doc,
    MARGIN + 46.3,
    140,
    43,
    "Kart Tahsilatı",
    formatPrice(data.cardTotal),
    `${data.cardCount} hesap`,
  );
  drawSummaryCard(
    doc,
    MARGIN + 92.6,
    140,
    43,
    "Ortalama Hesap",
    formatPrice(data.average),
    "Masa başına",
  );
  drawSummaryCard(
    doc,
    MARGIN + 138.9,
    140,
    43,
    "Kapanan Hesap",
    String(data.sales.length),
    `${data.itemCount} ürün`,
    true,
  );

  drawSectionDistribution(doc, data);
  drawHourlyChart(doc, data);
}

function categoryRows(categories: CategoryStat[]): CategoryStat[] {
  if (categories.length <= 8) return categories;
  const top = categories.slice(0, 7);
  const rest = categories.slice(7);
  const quantity = rest.reduce((sum, category) => sum + category.quantity, 0);
  const revenue = rest.reduce((sum, category) => sum + category.revenue, 0);
  const share = rest.reduce((sum, category) => sum + category.share, 0);
  return [
    ...top,
    {
      category: `Diğer (${rest.length} kategori)`,
      quantity,
      revenue,
      share,
    },
  ];
}

function drawCategoryTable(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 52;
  const rows = categoryRows(data.categories);
  const widths = [78, 24, 45, 35];
  const headers = ["Kategori", "Adet", "Ciro", "Pay"];
  const rowHeight = 7.2;
  const headerHeight = 8;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  setFill(doc, ESPRESSO);
  doc.roundedRect(x, y, tableWidth, headerHeight, 1.5, 1.5, "F");
  let cursorX = x;
  headers.forEach((header, index) => {
    const align = index >= 1 ? "right" : "left";
    drawText(doc, header, cursorX + (align === "right" ? widths[index] - 3 : 4), y + 5.4, {
      font: "bold",
      size: 6.5,
      color: CREAM,
      align,
    });
    cursorX += widths[index];
  });

  if (rows.length === 0) {
    setFill(doc, WHITE);
    doc.rect(x, y + headerHeight, tableWidth, rowHeight, "F");
    drawText(doc, "Bu gün satılan ürün yok.", x + 4, y + headerHeight + 4.8, {
      size: 7,
      color: MUTED,
    });
    return;
  }

  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    setFill(doc, index % 2 === 0 ? WHITE : PAPER);
    doc.rect(x, rowY, tableWidth, rowHeight, "F");
    drawText(
      doc,
      fitText(doc, row.category, widths[0] - 8, "normal", 7.2),
      x + 4,
      rowY + 4.8,
      { size: 7.2, color: INK },
    );
    drawText(doc, String(row.quantity), x + widths[0] + widths[1] - 3, rowY + 4.8, {
      size: 7.2,
      color: ESPRESSO_SOFT,
      align: "right",
    });
    drawText(doc, formatPrice(row.revenue), x + widths[0] + widths[1] + widths[2] - 3, rowY + 4.8, {
      size: 7.2,
      color: ESPRESSO,
      align: "right",
    });
    drawText(doc, `%${row.share.toFixed(1).replace(".", ",")}`, x + tableWidth - 3, rowY + 4.8, {
      font: "bold",
      size: 7.2,
      color: CARAMEL,
      align: "right",
    });
  });
}

function productRows(products: ProductStat[]): ProductStat[] {
  return products.slice(0, 18);
}

function drawProductTable(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 128;
  const rows = productRows(data.products);
  const widths = [9, 67, 41, 20, 45];
  const headers = ["#", "Ürün", "Kategori", "Adet", "Ciro"];
  const rowHeight = 6.7;
  const headerHeight = 8;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  drawText(doc, "EN ÇOK SATAN ÜRÜNLER", x, y - 7, {
    font: "bold",
    size: 6.8,
    color: MUTED,
    charSpace: 0.3,
  });
  drawText(doc, `${data.products.length} farklı ürün`, x + tableWidth, y - 7, {
    size: 6.2,
    color: MUTED,
    align: "right",
  });

  setFill(doc, ESPRESSO);
  doc.roundedRect(x, y, tableWidth, headerHeight, 1.5, 1.5, "F");
  let cursorX = x;
  headers.forEach((header, index) => {
    const align = index >= 3 ? "right" : index === 0 ? "center" : "left";
    drawText(
      doc,
      header,
      cursorX + (align === "right" ? widths[index] - 3 : align === "center" ? widths[index] / 2 : 4),
      y + 5.4,
      {
        font: "bold",
        size: 6.5,
        color: CREAM,
        align,
      },
    );
    cursorX += widths[index];
  });

  if (rows.length === 0) {
    setFill(doc, WHITE);
    doc.rect(x, y + headerHeight, tableWidth, rowHeight, "F");
    drawText(doc, "Bu gün satılan ürün yok.", x + 4, y + headerHeight + 4.8, {
      size: 7,
      color: MUTED,
    });
    return;
  }

  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    setFill(doc, index % 2 === 0 ? WHITE : PAPER);
    doc.rect(x, rowY, tableWidth, rowHeight, "F");
    drawText(doc, String(index + 1).padStart(2, "0"), x + widths[0] / 2, rowY + 4.5, {
      size: 6.5,
      color: CARAMEL,
      align: "center",
    });
    drawText(
      doc,
      fitText(doc, row.name, widths[1] - 8, "normal", 7.1),
      x + widths[0] + 4,
      rowY + 4.5,
      { size: 7.1, color: INK },
    );
    drawText(
      doc,
      fitText(doc, row.category, widths[2] - 8, "normal", 6.6),
      x + widths[0] + widths[1] + 4,
      rowY + 4.5,
      { size: 6.6, color: MUTED },
    );
    drawText(
      doc,
      String(row.quantity),
      x + widths[0] + widths[1] + widths[2] + widths[3] - 3,
      rowY + 4.5,
      { size: 7, color: ESPRESSO_SOFT, align: "right" },
    );
    drawText(doc, formatPrice(row.revenue), x + tableWidth - 3, rowY + 4.5, {
      font: "bold",
      size: 7,
      color: ESPRESSO,
      align: "right",
    });
  });

  if (data.products.length > rows.length) {
    drawText(
      doc,
      `En çok satan ${rows.length} ürün gösteriliyor; toplam ${data.products.length} ürün.`,
      x,
      y + headerHeight + rows.length * rowHeight + 6,
      { size: 6.2, color: MUTED },
    );
  }
}

function drawPageTwo(doc: jsPDF, data: DayReportData): void {
  drawPageHeader(doc, 2, "Ürün Detayı", data);
  drawText(doc, "Ürün ve Kategori Analizi", MARGIN, 38, {
    font: "bold",
    size: 16,
    color: ESPRESSO,
  });
  drawText(
    doc,
    "Kategori payları, satış adetleri ve en çok satan ürünler",
    MARGIN,
    43.5,
    { size: 7.4, color: MUTED },
  );

  drawText(doc, "KATEGORİ DAĞILIMI", MARGIN, 49, {
    font: "bold",
    size: 6.8,
    color: MUTED,
    charSpace: 0.3,
  });
  drawCategoryTable(doc, data);
  drawProductTable(doc, data);
}

function salesToShow(sales: Sale[]): Sale[] {
  return sales.slice(0, 34);
}

function drawSalesTable(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 52;
  const rows = salesToShow(data.sales);
  const widths = [14, 35, 26, 20, 14, 48, 25];
  const headers = ["Saat", "Masa", "Bölüm", "Ödeme", "Adet", "Ürünler", "Tutar"];
  const headerHeight = 8;
  const rowHeight = rows.length > 26 ? 5.7 : 7;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  setFill(doc, ESPRESSO);
  doc.roundedRect(x, y, tableWidth, headerHeight, 1.5, 1.5, "F");
  let cursorX = x;
  headers.forEach((header, index) => {
    const align = index === 4 || index === 6 ? "right" : "left";
    drawText(doc, header, cursorX + (align === "right" ? widths[index] - 3 : 3.5), y + 5.4, {
      font: "bold",
      size: 6.2,
      color: CREAM,
      align,
    });
    cursorX += widths[index];
  });

  if (rows.length === 0) {
    setFill(doc, WHITE);
    doc.rect(x, y + headerHeight, tableWidth, 14, "F");
    drawText(doc, "Bu tarihte kapanan hesap yok.", x + 4, y + headerHeight + 8, {
      size: 7.4,
      color: MUTED,
    });
    return;
  }

  rows.forEach((sale, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    setFill(doc, index % 2 === 0 ? WHITE : PAPER);
    doc.rect(x, rowY, tableWidth, rowHeight, "F");

    const baseY = rowY + (rowHeight > 6 ? 4.6 : 3.9);
    drawText(
      doc,
      new Date(sale.closedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      x + 3.5,
      baseY,
      { size: 6.4, color: ESPRESSO_SOFT },
    );
    drawText(
      doc,
      fitText(doc, sale.tableLabel, widths[1] - 7, "bold", 6.4),
      x + widths[0] + 3.5,
      baseY,
      { font: "bold", size: 6.4, color: INK },
    );
    drawText(
      doc,
      fitText(doc, sectionLabel(sale.section), widths[2] - 7, "normal", 6.2),
      x + widths[0] + widths[1] + 3.5,
      baseY,
      { size: 6.2, color: MUTED },
    );
    drawText(
      doc,
      paymentLabel(sale.paymentMethod),
      x + widths[0] + widths[1] + widths[2] + 3.5,
      baseY,
      { size: 6.2, color: ESPRESSO_SOFT },
    );
    drawText(
      doc,
      String(saleItemCount(sale)),
      x + widths[0] + widths[1] + widths[2] + widths[3] + widths[4] - 3,
      baseY,
      { size: 6.2, color: ESPRESSO_SOFT, align: "right" },
    );
    drawText(
      doc,
      fitText(doc, saleSummary(sale), widths[5] - 7, "normal", 5.8),
      x + widths[0] + widths[1] + widths[2] + widths[3] + widths[4] + 3.5,
      baseY,
      { size: 5.8, color: MUTED },
    );
    drawText(doc, formatPrice(sale.total), x + tableWidth - 3, baseY, {
      font: "bold",
      size: 6.5,
      color: ESPRESSO,
      align: "right",
    });
  });

  if (data.sales.length > rows.length) {
    drawText(
      doc,
      `En son ${rows.length} hesap gösteriliyor; toplam ${data.sales.length} hesap.`,
      x,
      y + headerHeight + rows.length * rowHeight + 5,
      { size: 6, color: MUTED },
    );
  }
}

function drawSalesTotals(doc: jsPDF, data: DayReportData): void {
  const x = MARGIN;
  const y = 262;
  const width = CONTENT_WIDTH;
  setFill(doc, ESPRESSO);
  doc.roundedRect(x, y, width, 14, 2.5, 2.5, "F");
  drawText(doc, "GÜNLÜK TOPLAM", x + 6, y + 6.4, {
    font: "bold",
    size: 6.2,
    color: CARAMEL,
    charSpace: 0.3,
  });
  drawText(
    doc,
    `${data.sales.length} hesap · ${data.itemCount} ürün · Nakit ${formatPrice(
      data.cashTotal,
    )} · Kart ${formatPrice(data.cardTotal)}`,
    x + 6,
    y + 10.7,
    { size: 6.1, color: [209, 195, 184] },
  );
  drawText(doc, formatPrice(data.revenue), x + width - 6, y + 9.4, {
    font: "bold",
    size: 14,
    color: CREAM,
    align: "right",
  });
}

function drawPageThree(doc: jsPDF, data: DayReportData): void {
  drawPageHeader(doc, 3, "Hesap Dökümü", data);
  drawText(doc, "Kapanan Hesaplar", MARGIN, 38, {
    font: "bold",
    size: 16,
    color: ESPRESSO,
  });
  drawText(
    doc,
    `${data.sales.length} adisyon · ${data.itemCount} ürün · ${formatPrice(
      data.revenue,
    )} ciro`,
    MARGIN,
    43.5,
    { size: 7.4, color: MUTED },
  );
  drawSalesTable(doc, data);
  drawSalesTotals(doc, data);
}

export function buildDayReportPdf(
  data: DayReportData,
  options: DayReportPdfOptions,
): jsPDF {
  const generatedAt = options.generatedAt ?? new Date();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  doc.addFileToVFS("NotoSans-Regular.ttf", options.fonts.regular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", options.fonts.bold);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans", "normal");

  doc.setProperties({
    title: `Boss Cafe Gün Sonu Raporu - ${data.date}`,
    subject: "Günlük ciro, ürün ve hesap dökümü",
    author: "Boss Cafe",
    creator: "Boss Cafe Yönetim Paneli",
  });

  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    if (page > 1) doc.addPage();
    setFill(doc, PAPER);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
  }

  doc.setPage(1);
  drawPageOne(doc, data);
  doc.setPage(2);
  drawPageTwo(doc, data);
  doc.setPage(3);
  drawPageThree(doc, data);

  drawFooter(doc, generatedAt, data.date);
  return doc;
}

export async function downloadDayReportPdf(
  data: DayReportData,
  fileName: string,
): Promise<void> {
  const fonts = await loadDayReportFonts();
  const doc = buildDayReportPdf(data, { fonts });
  doc.save(fileName);
}
