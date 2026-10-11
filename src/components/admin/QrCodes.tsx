import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  Download,
  Loader2,
  Minus,
  Plus,
  Printer,
} from "lucide-react";

const STORAGE_KEY = "boss-cafe-qr-tables";
const MIN_TABLES = 1;
const MAX_TABLES = 30;
const DEFAULT_TABLES = 8;

function readStoredTableCount(): number {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isInteger(stored) && stored >= MIN_TABLES && stored <= MAX_TABLES) {
      return stored;
    }
  } catch {
    // localStorage kapalı olabilir; varsayılana dön.
  }
  return DEFAULT_TABLES;
}

export default function QrCodes() {
  const [tableCount, setTableCount] = useState(readStoredTableCount);
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin);
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(tableCount));
    } catch {
      // yoksay: kalıcılık kritik değil
    }
  }, [tableCount]);

  const tables = useMemo(
    () => Array.from({ length: tableCount }, (_, index) => index + 1),
    [tableCount],
  );

  const menuUrl = useCallback(
    (table: number) => `${baseUrl.replace(/\/+$/, "")}/masa/${table}`,
    [baseUrl],
  );

  useEffect(() => {
    let active = true;
    setGenerating(true);
    setError(null);

    void (async () => {
      try {
        const next: Record<number, string> = {};
        for (const table of Array.from({ length: tableCount }, (_, i) => i + 1)) {
          next[table] = await QRCode.toDataURL(menuUrl(table), {
            width: 640,
            margin: 1,
            color: { dark: "#2A1C13", light: "#FDFBF7" },
          });
        }
        if (active) setCodes(next);
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "QR kodlar oluşturulamadı.",
          );
        }
      } finally {
        if (active) setGenerating(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [tableCount, menuUrl]);

  function handlePrint() {
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) {
      setError("Yazdırma penceresi açılamadı. Tarayıcı izinlerini kontrol edin.");
      return;
    }

    const cards = tables
      .map(
        (table) => `
          <figure class="card">
            <img src="${codes[table] ?? ""}" alt="Masa ${table} QR kodu" />
            <figcaption>Masa ${table}</figcaption>
            <span>${menuUrl(table)}</span>
          </figure>`,
      )
      .join("");

    win.document.write(`<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>Boss Cafe · Masa QR Kodları</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 24px; font-family: Georgia, serif; color: #2A1C13; background: #FDFBF7; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p.sub { margin: 0 0 20px; font-family: system-ui, sans-serif; font-size: 12px; color: #7B5A44; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .card { margin: 0; padding: 16px; border: 1px solid #E2D2C0; border-radius: 16px; text-align: center; break-inside: avoid; }
      .card img { width: 100%; max-width: 190px; height: auto; }
      figcaption { margin-top: 8px; font-size: 16px; font-weight: 600; }
      .card span { display: block; margin-top: 4px; font-family: system-ui, sans-serif; font-size: 10px; color: #7B5A44; word-break: break-all; }
    </style>
  </head>
  <body>
    <h1>Boss Cafe · Masa QR Kodları</h1>
    <p class="sub">Misafirler telefon kamerasıyla okutup masaya özel menüyü açar.</p>
    <div class="grid">${cards}</div>
    <script>window.onload = function () { window.print(); };</script>
  </body>
</html>`);
    win.document.close();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-espresso-800">Masa QR Kodları</h2>
          <p className="text-sm text-espresso-800/60">
            Her masa için QR kod üretin, indirin veya yazdırıp masalara
            yerleştirin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-espresso-700/15 bg-white/70 p-1">
            <button
              type="button"
              onClick={() =>
                setTableCount((count) => Math.max(MIN_TABLES, count - 1))
              }
              disabled={tableCount <= MIN_TABLES}
              aria-label="Masa sayısını azalt"
              className="flex h-8 w-8 items-center justify-center rounded-full text-espresso-700 transition hover:bg-espresso-700/10 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[5.5rem] text-center text-sm font-semibold text-espresso-800">
              {tableCount} masa
            </span>
            <button
              type="button"
              onClick={() =>
                setTableCount((count) => Math.min(MAX_TABLES, count + 1))
              }
              disabled={tableCount >= MAX_TABLES}
              aria-label="Masa sayısını artır"
              className="flex h-8 w-8 items-center justify-center rounded-full text-espresso-700 transition hover:bg-espresso-700/10 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={generating || Object.keys(codes).length === 0}
            className="btn btn-primary btn-sm"
          >
            <Printer className="h-4 w-4" />
            Tümünü Yazdır
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="qr-base-url" className="field-label">
          QR kodların yönleneceği adres
        </label>
        <input
          id="qr-base-url"
          type="url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://bosscafe.com"
          className="input sm:max-w-md"
        />
        <p className="mt-1.5 text-xs text-espresso-800/55">
          Yayına aldıktan sonra kendi alan adınızı yazın (ör. https://bosscafe.com).
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-espresso-500/25 bg-white/70 px-4 py-3 text-sm text-espresso-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
          {error}
        </p>
      )}

      {generating ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-espresso-700/10 bg-white/60 p-6 text-sm text-espresso-700">
          <Loader2 className="h-4 w-4 animate-spin text-caramel-600" />
          QR kodlar hazırlanıyor…
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div key={table} className="card flex flex-col items-center gap-3 p-5">
              {codes[table] ? (
                <img
                  src={codes[table]}
                  alt={`Masa ${table} QR kodu`}
                  className="h-40 w-40 rounded-xl border border-espresso-700/10 bg-cream-50"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-espresso-700/5 text-xs text-espresso-800/50">
                  QR oluşturulamadı
                </div>
              )}
              <p className="font-serif text-lg text-espresso-800">Masa {table}</p>
              <p className="w-full break-all text-center text-[11px] text-espresso-800/55">
                {menuUrl(table)}
              </p>
              <div className="flex gap-2">
                <a
                  href={codes[table] ?? "#"}
                  download={`masa-${table}-qr.png`}
                  className="btn btn-outline btn-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  İndir
                </a>
                <a
                  href={`/masa/${table}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Aç
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
