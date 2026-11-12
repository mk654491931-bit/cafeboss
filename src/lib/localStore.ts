/**
 * Boss Cafe'nin Supabase'siz (önizleme/çevrimdışı) kalıcı katmanı.
 *
 * Menü ve galeri fotoğrafları base64 data URL olarak saklandığı için
 * localStorage'ın ~5 MB kotası kısa sürede doluyor ve yazmalar sessizce
 * başarısız oluyordu. IndexedDB hem çok daha büyük bir kota sunar hem de
 * okumayı ana iş parçacığını kilitlemeden yapar. Eski localStorage kayıtları
 * ilk okumada kaybolmadan IndexedDB'ye taşınır.
 */
const DB_NAME = "boss-cafe-local";
const DB_VERSION = 1;
const STORE_NAME = "kv";
const OPEN_TIMEOUT_MS = 2500;

let databasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      resolve(db);
    };

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) {
          db.close();
          return;
        }
        db.onversionchange = () => db.close();
        finish(db);
      };
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
      window.setTimeout(() => finish(null), OPEN_TIMEOUT_MS);
    } catch {
      finish(null);
    }
  });

  return databasePromise;
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    try {
      const request = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error ?? new Error("okuma_hatasi"));
    } catch (error) {
      reject(error);
    }
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("yazma_hatasi"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("yazma_iptal"));
      transaction.objectStore(STORE_NAME).put(value, key);
    } catch (error) {
      reject(error);
    }
  });
}

function readLegacyValue<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readLocalValue<T>(key: string): Promise<T | null> {
  const db = await openDatabase();

  if (db) {
    try {
      const stored = await idbGet<T>(db, key);
      if (stored !== undefined) return stored;
    } catch {
      // IndexedDB okunamadıysa eski localStorage kopyasını deneyeceğiz.
    }
  }

  const legacy = readLegacyValue<T>(key);
  if (legacy === null) return null;

  // Eski sürümde localStorage'a yazılmış veriyi kaybetme; IndexedDB'ye taşı.
  if (db) {
    try {
      await idbPut(db, key, legacy);
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Kopya kalabilir; veri zaten IndexedDB'de.
      }
    } catch {
      // Taşıma başarısızsa eski kayıtla çalışmaya devam et.
    }
  }

  return legacy;
}

export async function writeLocalValue(
  key: string,
  value: unknown,
): Promise<void> {
  const db = await openDatabase();

  if (db) {
    try {
      await idbPut(db, key, value);
      return;
    } catch {
      // IndexedDB yazamadıysa localStorage'a düş; ama sessizce yutma.
    }
  }

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      "Tarayıcı depolaması dolu veya kapalı. Fotoğraf boyutunu küçültüp tekrar deneyin; kayıtlarınız silinmedi.",
    );
  }
}
