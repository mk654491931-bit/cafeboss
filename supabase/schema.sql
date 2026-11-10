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

-- ---------------------------------------------------------------------------
-- Kasa: masalar, açık adisyonlar ve kapanan hesaplar
-- Telefon ve masaüstü aynı kayıtları görsün diye localStorage yerine burada.
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_tables (
  id text primary key,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  section text not null check (section in ('cafe', 'okey')),
  created_at timestamptz not null default now()
);

create unique index if not exists cafe_tables_section_label_unique
  on public.cafe_tables (section, lower(btrim(label)));

insert into public.cafe_tables (id, label, section)
select s.section || '-' || g.n, 'Masa ' || g.n, s.section
from (values ('cafe'), ('okey')) as s(section)
cross join generate_series(1, 8) as g(n)
on conflict do nothing;

create table if not exists public.table_orders (
  table_id text primary key references public.cafe_tables(id) on delete cascade,
  opened_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  table_id text not null references public.table_orders(table_id) on delete cascade,
  product_id text not null,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  added_at timestamptz not null default now(),
  unique (table_id, product_id)
);

create index if not exists order_items_table_id_idx
  on public.order_items (table_id);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  table_id text not null,
  table_label text not null,
  section text not null check (section in ('cafe', 'okey')),
  total numeric(10, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('cash', 'card')),
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  opened_at timestamptz
);

-- Daha önce kurulmuş kasalarda masa oturumu kolonunu ekle.
alter table public.sales add column if not exists opened_at timestamptz;

create index if not exists sales_closed_at_idx
  on public.sales (closed_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  position integer not null default 0
);

create index if not exists sale_items_sale_id_idx
  on public.sale_items (sale_id);

alter table public.cafe_tables enable row level security;
alter table public.table_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "cafe_tables_admin_all" on public.cafe_tables;
create policy "cafe_tables_admin_all"
  on public.cafe_tables for all to authenticated
  using (true) with check (true);

drop policy if exists "table_orders_admin_all" on public.table_orders;
create policy "table_orders_admin_all"
  on public.table_orders for all to authenticated
  using (true) with check (true);

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all to authenticated
  using (true) with check (true);

drop policy if exists "sales_admin_all" on public.sales;
create policy "sales_admin_all"
  on public.sales for all to authenticated
  using (true) with check (true);

drop policy if exists "sale_items_admin_all" on public.sale_items;
create policy "sale_items_admin_all"
  on public.sale_items for all to authenticated
  using (true) with check (true);

-- Ürün ekleme kilitlenmeden, aynı masa için adet artırımı atomik olsun.
create or replace function public.add_order_item(
  p_table_id text,
  p_product_id text,
  p_quantity integer default 1
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name text;
  v_category text;
  v_price numeric(10, 2);
  v_available boolean;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'invalid_quantity';
  end if;

  if not exists (select 1 from public.cafe_tables where id = p_table_id) then
    raise exception 'table_not_found';
  end if;

  select name, category, price, is_available
    into v_name, v_category, v_price, v_available
  from public.products
  where id::text = p_product_id;

  if not found then
    raise exception 'product_not_found';
  end if;
  if not v_available then
    raise exception 'product_unavailable';
  end if;

  insert into public.table_orders (table_id)
  values (p_table_id)
  on conflict (table_id) do nothing;

  insert into public.order_items
    (table_id, product_id, name, category, price, quantity)
  values
    (p_table_id, p_product_id, v_name, v_category, v_price, p_quantity)
  on conflict (table_id, product_id) do update
    set quantity = public.order_items.quantity + excluded.quantity;
end;
$$;

create or replace function public.change_order_item_quantity(
  p_table_id text,
  p_product_id text,
  p_delta integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_quantity integer;
begin
  if p_delta is null or p_delta = 0 or abs(p_delta) > 99 then
    raise exception 'invalid_quantity';
  end if;

  select quantity into v_quantity
  from public.order_items
  where table_id = p_table_id and product_id = p_product_id
  for update;

  if not found then
    raise exception 'item_not_found';
  end if;

  v_quantity := v_quantity + p_delta;

  if v_quantity <= 0 then
    delete from public.order_items
    where table_id = p_table_id and product_id = p_product_id;
  else
    update public.order_items
    set quantity = v_quantity
    where table_id = p_table_id and product_id = p_product_id;
  end if;

  delete from public.table_orders o
  where o.table_id = p_table_id
    and not exists (
      select 1 from public.order_items i where i.table_id = p_table_id
    );
end;
$$;

create or replace function public.remove_order_item(
  p_table_id text,
  p_product_id text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.order_items
  where table_id = p_table_id and product_id = p_product_id;

  if not found then
    raise exception 'item_not_found';
  end if;

  delete from public.table_orders o
  where o.table_id = p_table_id
    and not exists (
      select 1 from public.order_items i where i.table_id = p_table_id
    );
end;
$$;

create or replace function public.close_kasa_table(
  p_table_id text,
  p_payment_method text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_table_label text;
  v_section text;
  v_opened_at timestamptz;
  v_total numeric(10, 2);
  v_sale_id uuid;
begin
  if p_payment_method not in ('cash', 'card') then
    raise exception 'invalid_payment_method';
  end if;

  select label, section into v_table_label, v_section
  from public.cafe_tables
  where id = p_table_id;

  if not found then
    raise exception 'table_not_found';
  end if;

  select opened_at into v_opened_at
  from public.table_orders
  where table_id = p_table_id
  for update;

  if not found then
    raise exception 'order_empty';
  end if;

  select sum(price * quantity) into v_total
  from public.order_items
  where table_id = p_table_id;

  if v_total is null or v_total <= 0 then
    raise exception 'order_empty';
  end if;

  insert into public.sales
    (table_id, table_label, section, total, payment_method, closed_at, opened_at)
  values
    (p_table_id, v_table_label, v_section, v_total, p_payment_method, now(), v_opened_at)
  returning id into v_sale_id;

  insert into public.sale_items
    (sale_id, name, category, price, quantity, position)
  select
    v_sale_id,
    name,
    category,
    price,
    quantity,
    (row_number() over (order by added_at, product_id))::integer
  from public.order_items
  where table_id = p_table_id;

  delete from public.table_orders where table_id = p_table_id;

  return v_sale_id;
end;
$$;

-- Özet kartları: tüm zamanlar ve seçili gün için tek satır döner.
-- Satış satırları istemciye taşınmadan toplamlar veritabanında hesaplanır.
create or replace function public.get_kasa_summary(
  p_day_start timestamptz,
  p_day_end timestamptz
)
returns table (
  all_revenue numeric,
  all_count bigint,
  day_revenue numeric,
  day_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(total), 0)::numeric as all_revenue,
    count(*)::bigint as all_count,
    coalesce(
      sum(total) filter (
        where closed_at >= p_day_start and closed_at < p_day_end
      ),
      0
    )::numeric as day_revenue,
    count(*) filter (
      where closed_at >= p_day_start and closed_at < p_day_end
    )::bigint as day_count
  from public.sales;
$$;

create or replace function public.delete_cafe_table(p_table_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.cafe_tables where id = p_table_id) then
    raise exception 'table_not_found';
  end if;

  if exists (select 1 from public.order_items where table_id = p_table_id) then
    raise exception 'table_open';
  end if;

  delete from public.cafe_tables where id = p_table_id;
end;
$$;

grant usage on schema public to authenticated;
grant select on public.products to authenticated;
grant select, insert, update, delete
  on public.cafe_tables, public.table_orders, public.order_items,
     public.sales, public.sale_items
  to authenticated;

revoke all on function public.add_order_item(text, text, integer) from public;
revoke all on function public.change_order_item_quantity(text, text, integer) from public;
revoke all on function public.remove_order_item(text, text) from public;
revoke all on function public.close_kasa_table(text, text) from public;
revoke all on function public.delete_cafe_table(text) from public;
revoke all on function public.get_kasa_summary(timestamptz, timestamptz) from public;

grant execute on function public.add_order_item(text, text, integer) to authenticated;
grant execute on function public.change_order_item_quantity(text, text, integer) to authenticated;
grant execute on function public.remove_order_item(text, text) to authenticated;
grant execute on function public.close_kasa_table(text, text) to authenticated;
grant execute on function public.delete_cafe_table(text) to authenticated;
grant execute on function public.get_kasa_summary(timestamptz, timestamptz) to authenticated;

-- Canlı senkron: iki cihaz birbirinin masa/adisyon değişikliklerini anında görsün.
do $$
declare
  v_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['cafe_tables', 'table_orders', 'order_items', 'sales'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;
