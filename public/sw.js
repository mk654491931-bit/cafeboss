/* Boss Cafe · çevrimdışı / zayıf ağ dayanıklılığı */
const CACHE_NAME = "boss-cafe-shell-v2";
const NAVIGATION_TIMEOUT_MS = 6000;
const STATIC_PATHS = [
  "/logo.svg",
  "/favicon.svg",
  "/photos/hero.jpg",
  "/photos/about.jpg",
  "/photos/gallery-interior.jpg",
  "/photos/gallery-latte.jpg",
  "/photos/gallery-snack.jpg",
  "/photos/gallery-filter.jpg",
  "/photos/gallery-barista.jpg",
  "/photos/gallery-pastry.jpg",
];

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch("/index.html", { cache: "no-store" });
  if (!response.ok) return;

  const html = await response.clone().text();
  await cache.put("/index.html", response.clone());
  await cache.put("/", response.clone());

  // İlk ziyarette paketler service worker kurulmadan önce yüklendiği için
  // index.html'in işaret ettiği hash'li JS/CSS dosyalarını da önden al.
  const assetPaths = Array.from(
    html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
    (match) => match[1],
  );

  await Promise.all(
    [...STATIC_PATHS, ...assetPaths].map((path) =>
      cache.add(path).catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("boss-cafe-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAVIGATION_TIMEOUT_MS);

  try {
    const response = await fetch(request, { signal: controller.signal });
    if (!response.ok) throw new Error("bad_response");
    const cache = await caches.open(CACHE_NAME);
    await cache.put("/index.html", response.clone());
    await cache.put("/", response.clone());
    return response;
  } catch {
    const cached =
      (await caches.match("/index.html")) || (await caches.match("/"));
    if (cached) return cached;
    throw new Error("offline");
  } finally {
    clearTimeout(timer);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (!response.ok || response.type !== "basic") return response;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) return response;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
