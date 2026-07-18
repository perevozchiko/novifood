-- Open Food Facts is kept as a small, shared cache. User edits live separately
-- so they never modify data imported from the public catalogue.

drop index if exists idx_products_name_lower;

alter table products
  add column if not exists updated_at timestamptz not null default now();

-- The old unique index prevented two differently packaged products with the
-- same name from being cached. Trigram search keeps substring lookup fast.
create extension if not exists pg_trgm;
create index if not exists products_name_trgm_idx
  on products using gin (lower(name) gin_trgm_ops);

create table if not exists user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_product_id text references products(id) on delete set null,
  name text not null,
  energy_100g real not null default 0,
  proteins_100g real not null default 0,
  fat_100g real not null default 0,
  carbs_100g real not null default 0,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_products_user_base_unique
  on user_products (user_id, base_product_id)
  where base_product_id is not null;
create index if not exists user_products_user_name_trgm_idx
  on user_products using gin (lower(name) gin_trgm_ops);

alter table products enable row level security;
alter table user_products enable row level security;

drop policy if exists "products_read_authenticated" on products;
create policy "products_read_authenticated" on products
  for select to authenticated using (true);
drop policy if exists "products_insert_authenticated" on products;
drop policy if exists "products_update_authenticated" on products;
create policy "products_insert_authenticated" on products
  for insert to authenticated with check (true);
create policy "products_update_authenticated" on products
  for update to authenticated using (true) with check (true);

drop policy if exists "user_products_select_own" on user_products;
drop policy if exists "user_products_insert_own" on user_products;
drop policy if exists "user_products_update_own" on user_products;
drop policy if exists "user_products_delete_own" on user_products;
create policy "user_products_select_own" on user_products for select using (auth.uid() = user_id);
create policy "user_products_insert_own" on user_products for insert with check (auth.uid() = user_id);
create policy "user_products_update_own" on user_products for update using (auth.uid() = user_id);
create policy "user_products_delete_own" on user_products for delete using (auth.uid() = user_id);
