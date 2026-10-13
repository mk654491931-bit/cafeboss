# Boss Cafe

Eleşkirt merkezli Boss Cafe için dijital menü ve yönetim paneli. Tek sayfalık tanıtım sitesi, masaya özel QR menü ve admin panelinden menü/fiyat/stok yönetimi.

## Özellikler

- **Tanıtım sitesi:** hero, hakkımızda, galeri, okey salonu, dijital menü ve iletişim bölümleri
- **QR masa menüsü:** `/masa/:masaNo` (ör. `/masa/5`) — masaya özel menü, "Garson Çağır" ve arama/filtreleme
- **Admin paneli:** `/admin` — ürün ekleme/düzenleme (fotoğrafı cihazdan yükleme veya "Mekândan Kareler" galerisinden seçme), fiyat ve stok güncelleme, galeri ("Mekândan Kareler") fotoğraf ekleme/çıkarma
- **Scroll efektleri:** okuma ilerleme çubuğu, scroll spy, hero parallax, reveal animasyonları, yukarı çık butonu (`prefers-reduced-motion` desteğiyle)
- **Veri katmanı:** Supabase (menü okuma, yazma ve auth)

## Teknolojiler

Vite · React 18 · TypeScript · Tailwind CSS · React Router · Supabase · lucide-react

## Kurulum

```bash
bun install
```

Kök dizinde `.env` (veya `.env.local`) dosyası oluşturup anahtarları ekle:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GITHUB_TOKEN=...
```

> `GITHUB_TOKEN` yalnızca CLI/sunucu tarafında kullanılır; **asla `VITE_` önekiyle eklemeyin**.
> Vite tüm `VITE_` değişkenlerini tarayıcı paketine gömer, bu da token'ı herkese açar.

Freebuff'te bu anahtarlar **Keys / API keys** sekmesine `GITHUB_TOKEN` adıyla girilir.

Ardından `supabase/schema.sql` dosyasını Supabase SQL editöründe çalıştırarak `products` / `site_content` tablolarını, `site-images` görsel deposunu ve RLS politikalarını oluştur.

> Supabase tanımlı değilken galeri ("Mekândan Kareler") tarayıcıdaki yerel kopyayı kullanır, böylece panel dışında da önizlemede çalışır; ürün ve galeri kalıcılığı için Supabase anahtarları gerekir.

## Komutlar

```bash
bun run dev           # geliştirme sunucusu
bun run build         # üretim derlemesi (dist/)
bun run preview       # derlenmiş çıktıyı önizle
bun run typecheck     # tsc -b --noEmit
bun run github:check  # GitHub bağlantısını doğrula
```

## GitHub entegrasyonu

- **CI:** `.github/workflows/ci.yml` her push/PR'da `bun install` → `bun run typecheck` →
  `bun run build` çalıştırır ve `dist/` çıktısını artifact olarak saklar. CI,
  `secrets.GITHUB_TOKEN` ile hazır gelen token'ı kullanır; ayrıca anahtar gerekmez.
- **Doğrulama:** `bun run github:check` (`scripts/github-check.mjs`) token'ın geçerliliğini
  (`GET /user`) ve hedef repoya erişimi (`GET /repos/...`) kontrol eder, repoda içerik olup
  olmadığını da söyler. Hedef repo `GITHUB_REPO` ile değiştirilebilir.
- **Gerekli anahtar:** `GITHUB_TOKEN` — GitHub → Settings → Developer settings → Personal
  access tokens adresinden `repo` scope'lu bir classic token oluşturup Keys sekmesine ekleyin.

## Rotalar

| Rota | Açıklama |
| --- | --- |
| `/` | Tanıtım sitesi ve dijital menü |
| `/masa/:masaNo` | Masaya özel QR menü |
| `/admin` | Yönetim paneli |
