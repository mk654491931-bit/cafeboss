-- Boss Cafe (Eleşkirt) — products table, RLS policies, and seed data.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null check (price >= 0),
  description text,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

alter table public.products enable row level security;

-- Public menu is read-only for visitors.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only a signed-in admin may write.
drop policy if exists "Authenticated can insert products" on public.products;
create policy "Authenticated can insert products"
  on public.products for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update products" on public.products;
create policy "Authenticated can update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete products" on public.products;
create policy "Authenticated can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed data — kahve, çay, tatlı, nargile, kahvaltılıklar ve okey salonu
-- (image_url null → kartta kategoriye özel görsel yer tutucu gösterilir)
-- ---------------------------------------------------------------------------
insert into public.products (name, category, price, description, image_url, is_available)
values
  -- Sıcak Kahveler
  ('Türk Kahvesi',             'Sıcak Kahveler',   90, 'Geleneksel cezvede pişirilmiş, bol köpüklü klasik Türk kahvesi.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80', true),
  ('Espresso',                 'Sıcak Kahveler',   95, 'Tek çekirdek, yoğun gövdeli ve çikolatamsı bitişli saf espresso.', 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=800&q=80', true),
  ('Flat White',               'Sıcak Kahveler',  145, 'Kadifemsi süt köpüğü ve çift shot espresso ile dengeli bir fincan.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80', true),
  ('V60 Filtre Kahve',         'Sıcak Kahveler',  135, 'El ile demlenmiş, meyvemsi asitli Etiyopya çekirdeği.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', true),
  ('Sıcak Çikolata',           'Sıcak Kahveler',  130, 'Bitter çikolatadan eritilmiş, üzeri taze krema ile.', null, true),
  ('Salep',                    'Sıcak Kahveler',  120, 'Tarçınlı, sıcak sütlü salep; soğuk Eleşkirt akşamlarının klasiği.', null, true),

  -- Soğuk Kahveler
  ('Buzlu Latte',              'Soğuk Kahveler',  150, 'Buz üzerinde süt ve espresso; hafif ve ferahlatıcı.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', true),
  ('Cold Brew',                'Soğuk Kahveler',  160, '18 saat soğuk demlenmiş, düşük asitli yoğun lezzet.', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', false),
  ('Frappé',                   'Soğuk Kahveler',  155, 'Buz, süt ve köpükle çırpılmış yaz klasiği.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', true),
  ('İced Americano',           'Soğuk Kahveler',  130, 'Espresso ve buz; sade, net ve serinletici.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80', true),

  -- Çaylar
  ('Türk Çayı (Bardak)',       'Çaylar',           45, 'Rize çayı, semaverden taze demlenmiş.', null, true),
  ('Semaver Çayı (Demlik)',    'Çaylar',          130, 'İki kişilik demlik; yanında limon dilimi ile.', null, true),
  ('Kış Çayı',                 'Çaylar',           90, 'Tarçın, karanfil, zencefil ve portakal kabuğu karışımı.', null, true),
  ('Ihlamur',                  'Çaylar',           80, 'Bal ve limonla servis edilen rahatlatıcı ıhlamur.', null, true),
  ('Naneli Limon',             'Çaylar',           85, 'Taze nane yaprakları ve limon; ferahlatıcı bitki çayı.', null, true),
  ('Yeşil Çay',                'Çaylar',           75, 'Hafif, antioksidan yönü yüksek sade yeşil çay.', null, false),

  -- Tatlılar
  ('San Sebastian Cheesecake', 'Tatlılar',        185, 'Üstü yakılmış, içi akışkan klasik Bask usulü cheesecake.', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', true),
  ('Tiramisu',                 'Tatlılar',        165, 'Sicilya kahvesi ve mascarpone katmanları, kakao tozu ile.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', true),
  ('Çikolatalı Sufle',         'Tatlılar',        155, 'Sıcak servis edilen, akışkan çikolatalı mini sufle.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', false),
  ('Limonlu Cheesecake',       'Tatlılar',        160, 'Hafif, ferah ve taze limon kremalı fırın cheesecake.', 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=800&q=80', true),
  ('Fıstıklı Künefe',          'Tatlılar',        175, 'Tel kadayıf arasında Antep fıstıklı hatay peyniri, sıcak servis.', null, true),
  ('Antep Baklavası',          'Tatlılar',        150, 'Porsiyon; bol fıstıklı, tereyağlı ev baklavası.', null, true),

  -- Nargile
  ('Boss Nargile (Karışık)',   'Nargile',         300, 'Şefin özel karışımı; elma, üzüm ve nane notaları bir arada.', null, true),
  ('Elma Nargile',             'Nargile',         260, 'İki elma tütünü, klasik ve yumuşak içimli.', null, true),
  ('Üzüm & Nane Nargile',      'Nargile',         270, 'Tatlı üzüm ile serin nane dengesi.', null, true),
  ('Karpuz Nane Nargile',      'Nargile',         270, 'Yaz ferahlığı; karpuz ve nane aroması.', null, false),
  ('Buzlu Nargile',            'Nargile',         320, 'Buz başlıkla servis edilen ekstra serin içim.', null, true),

  -- Kahvaltılıklar
  ('Serpme Kahvaltı',          'Kahvaltılıklar',  380, 'Kişi başı; peynir çeşitleri, zeytin, reçel, sıcak ekmek ve daha fazlası.', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80', true),
  ('Menemen',                  'Kahvaltılıklar',  175, 'Tereyağında domates ve biberle pişmiş, yanında sıcak ekmek.', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80', false),
  ('Kaşarlı Tost',             'Kahvaltılıklar',  140, 'Ekşi mayalı ekmekte bol kaşar; yanında turşu ile.', null, true),
  ('Simit & Kaymak',           'Kahvaltılıklar',  120, 'Taze simit, kaymak ve bal üçlüsü.', null, true),

  -- Okey Salonu
  ('Okey Masası (Saatlik)',    'Okey Salonu',     100, 'Dört kişilik modern masada saatlik oyun; masaya çay servisi dahil.', null, true),
  ('Özel Oda (2 Saat)',        'Okey Salonu',     180, 'Kalabalık gruplar için ayrı bölme, 2 saatlik kullanım.', null, true)
on conflict do nothing;

-- Create the admin user in Authentication → Users instead of here.
-- Then sign in at /admin with that email and password.
