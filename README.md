# Boss Cafe

Eleşkirt merkezli Boss Cafe için dijital menü ve yönetim paneli. Tek sayfalık tanıtım sitesi ve admin panelinden menü/fiyat/stok yönetimi.

## Özellikler

- **Tanıtım sitesi:** hero, hakkımızda, galeri, okey salonu, dijital menü ve iletişim bölümleri
- **Admin paneli:** `/admin` — ürün ekleme/düzenleme (fotoğrafı cihazdan yükleme veya "Mekândan Kareler" galerisinden seçme), fiyat ve stok güncelleme, galeri ("Mekândan Kareler") fotoğraf ekleme/çıkarma
- **Kasa & masalar:** Kafe ve Okey Salonu olarak ikiye ayrılmış masa haritası (8 + 8 varsayılan masa), masa ekleme/kaldırma, menüden adisyon oluşturma, adet/toplam takibi, nakit/kart ödeme seçimi, hesap kapatınca tutarı genel kasaya işleme, masa fişi yazdırma ve 4 sayfalık, bir önceki güne göre ciro değişimini, günün en çok satan 17 ürününü ve masa oturumlarını içeren PDF gün sonu raporu
- **Ortak kasa:** Masalar, açık adisyonlar ve kapanan hesaplar Supabase'de saklanır; telefondan eklenen ürün masaüstünde canlı olarak görünür, sayfa yenilense veya cihaz değişse de kaybolmaz
- **Scroll efektleri:** okuma ilerleme çubuğu, scroll spy, hero parallax, reveal animasyonları, yukarı çık butonu (`prefers-reduced-motion` desteğiyle)
- **Veri katmanı:** Supabase (menü, kasa, galeri, auth ve canlı senkronizasyon)

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

Ardından `supabase/schema.sql` dosyasını Supabase SQL editöründe çalıştırarak `products` / `site_content` tablolarını, kasa tablolarını (`cafe_tables`, `table_orders`, `order_items`, `sales`, `sale_items`), `site-images` görsel deposunu, fonksiyonları, RLS politikalarını ve canlı senkronizasyonu oluştur. Daha önce şemayı çalıştırdıysanız dosyayı yeniden çalıştırmanız yeterlidir; mevcut kayıtlar silinmez.
>
> Daha önce yalnızca tarayıcıda tutulan kasa kayıtları ortak kasaya otomatik taşınmaz. Şema kurulduktan sonra masa/adisyon/satış kayıtları Supabase'de birikmeye başlar.

> Supabase tanımlı değilken galeri ("Mekândan Kareler") tarayıcıdaki yerel kopyayı kullanır, böylece panel dışında da önizlemede çalışır; ürün ve galeri kalıcılığı için Supabase anahtarları gerekir.
>
> Aynı durumda `/admin` yerel önizleme oturumuyla açılır (kullanıcı adı `admin`, şifre `admin`) ve kasa kayıtları tarayıcıda saklanır. Sipariş ekranı, Supabase menüsü bağlanana kadar örnek menüyle çalışır. Supabase anahtarları tanımlandığında gerçek menü, Supabase Auth ve cihazlar arası ortak kasa otomatik olarak devreye girer.

### Veritabanı dayanıklılığı

- Ücretsiz Supabase projeleri, 7 gün boyunca yeterli veritabanı etkinliği olmazsa duraklatılır. Bu bir şema veya migration sorunu değildir; proje duraklatıldıysa Supabase panelinden **Resume project** denmelidir. Kalıcı garanti için Supabase Pro gerekir.
- `api/keepalive.js`, Vercel Cron ile günde bir kez Supabase'e üç hafif okuma isteği gönderir. Vercel'de Supabase URL ve anon anahtarı tanımlıysa projenin hareketsizlik nedeniyle duraklatılmasını önlemeye yardımcı olur.
- Okuma istekleri geçici ağ/`429`/`5xx` hatalarında otomatik olarak yeniden denenir; yazma işlemlerinden önce admin oturumu tazelenir.
- Mevcut `supabase/schema.sql` tabloları, kasa tablolarını, RLS politikalarını, stok kilitlenmesini önleyen atomik kasa fonksiyonlarını ve görsel deposunu oluşturur.
- Kasa değişiklikleri `postgres_changes` ile anlık senkronize edilir. Yedek tarama 60 saniyede bir çalışır; Realtime açıkken yalnızca 5 dakikada bir, bağlantı koptuğunda her dakika yenilenir ve sekme görünmezken tamamen durur. Pencere odağı/çevrimiçi olma da yenilemeyi tetikler. Açık adisyon ve masa kaldırma/satış kapatma işlemleri atomik veritabanı fonksiyonlarıyla yapılır.
- Egress için satış geçmişinin tamamı panelde tutulmaz. Genel kasa/bugünkü ciro kartları `get_kasa_summary` SQL toplamından gelir; gün sonu raporu yalnızca seçili gün ve bir önceki günü satırlarıyla birlikte okur. Günün en çok satan 17 ürünü bu günün `sale_items` kayıtlarından hesaplanır.
- Masa oturumu, adisyona ilk ürün eklendiğinde başlar (`opened_at`) ve hesap kapatıldığında biter (`closed_at`). Raporda geliş, kalkış, süre ve ciro gösterilir; eski satışlarda `opened_at` yoksa geliş/süre “—” olarak görünür.

### Açılış ve ağ dayanıklılığı

- `index.html` içindeki marka yükleme ekranı, JS paketi gelene kadar boş beyaz ekran yerine anında görünür. 12 saniyeden uzun süren yüklemede yenileme bağlantısı çıkar.
- Fraunces ve Inter fontları artık Google Fonts yerine projeyle birlikte yerelden servis edilir; harici font isteği sayfayı kilitlemez.
- Public site paketi yalnızca ana sayfayı içerir; `/admin` ayrı bir paket olarak yalnızca panel açıldığında indirilir.
- Supabase okuma/yazma isteklerinde 12 saniyelik zaman aşımı, admin oturum kontrolünde 8 saniyelik zaman aşımı vardır. Böylece bağlantı yavaşladığında ekran sonsuza kadar spinner’da kalmaz.
- Beklenmeyen render veya paket yükleme hataları `ErrorBoundary` tarafından yakalanır; kullanıcıya yenileme ve ana sayfa bağlantısı gösterilir.
- Üretimde `public/sw.js` uygulama kabuğunu önbelleğe alır. Site bir kez açıldıktan sonra kısa süreli ağ/ISS kesintilerinde önbellekten açılabilir. İlk ziyaret yine ağ gerektirir.
- `vercel.app` adresine erişim tamamen ISS/DNS kaynaklı engelliyse bu kodla aşılamaz; kalıcı çözüm kendi alan adınızı bağlamak veya farklı bir DNS/ağ kullanmaktır.

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
| `/admin` | Yönetim paneli |

> Vercel'de SPA rotaları `/admin` gibi doğrudan adreslerden yenilendiğinde 404 vermemesi için `vercel.json` içindeki rewrite kuralı tüm bilinmeyen yolları `index.html` dosyasına yönlendirir.
