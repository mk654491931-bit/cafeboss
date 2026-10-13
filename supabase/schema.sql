-- Boss Cafe · Supabase şeması
-- Supabase panelindeki SQL Editor'de bir kez çalıştırın.
-- Yeniden çalıştırılabilir: politikalar önce düşürülür.

-- ---------------------------------------------------------------------------
-- Menü ürünleri
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price > 0),
  description text,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (true);

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert to authenticated
  with check (true);

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update to authenticated
  using (true) with check (true);

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Bölüm içerikleri (ör. galeri fotoğrafları) — anahtar/değer JSON
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read"
  on public.site_content for select
  using (true);

drop policy if exists "site_content_admin_insert" on public.site_content;
create policy "site_content_admin_insert"
  on public.site_content for insert to authenticated
  with check (true);

drop policy if exists "site_content_admin_update" on public.site_content;
create policy "site_content_admin_update"
  on public.site_content for update to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Görsel deposu (admin panelinden yüklenen fotoğraflar)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read"
  on storage.objects for select
  using (bucket_id = 'site-images');

drop policy if exists "site_images_admin_insert" on storage.objects;
create policy "site_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images');

drop policy if exists "site_images_admin_update" on storage.objects;
create policy "site_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-images');

drop policy if exists "site_images_admin_delete" on storage.objects;
create policy "site_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-images');
