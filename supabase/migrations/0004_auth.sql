-- NoviFood migration 004: email/password auth with per-user data isolation.

-- ─── settings: one row per user ───────────────────────────────────────────────
alter table settings drop constraint if exists settings_id_check;

alter table settings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ─── user_id on data tables ───────────────────────────────────────────────────
alter table meals
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table weight
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table water_intake
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill legacy single-user rows to the earliest auth user before cleanup.
do $$
declare
  default_user uuid;
begin
  select id into default_user from auth.users order by created_at limit 1;
  if default_user is not null then
    update settings set user_id = default_user where user_id is null;
    update meals set user_id = default_user where user_id is null;
    update weight set user_id = default_user where user_id is null;
    update water_intake set user_id = default_user where user_id is null;
  end if;
end $$;

-- Drop legacy single-user row and id column; user_id becomes the primary key.
delete from settings where user_id is null;

alter table settings drop constraint if exists settings_pkey;
alter table settings drop column if exists id;
alter table settings alter column user_id set not null;
alter table settings add primary key (user_id);

delete from meals where user_id is null;
delete from weight where user_id is null;
delete from water_intake where user_id is null;

alter table meals alter column user_id set default auth.uid();
alter table meals alter column user_id set not null;

alter table weight alter column user_id set default auth.uid();
alter table weight alter column user_id set not null;

alter table water_intake alter column user_id set default auth.uid();
alter table water_intake alter column user_id set not null;

-- ─── ai_usage: per-user daily counter ─────────────────────────────────────────
create table ai_usage_new (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  usage_date  date    not null default current_date,
  count       integer not null default 0,
  primary key (user_id, usage_date)
);

drop table if exists ai_usage;
alter table ai_usage_new rename to ai_usage;

-- ─── default settings for new sign-ups ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── row level security ───────────────────────────────────────────────────────
alter table meals enable row level security;
alter table weight enable row level security;
alter table water_intake enable row level security;
alter table settings enable row level security;
alter table ai_usage enable row level security;

create policy "meals_select_own" on meals for select using (auth.uid() = user_id);
create policy "meals_insert_own" on meals for insert with check (auth.uid() = user_id);
create policy "meals_update_own" on meals for update using (auth.uid() = user_id);
create policy "meals_delete_own" on meals for delete using (auth.uid() = user_id);

create policy "weight_select_own" on weight for select using (auth.uid() = user_id);
create policy "weight_insert_own" on weight for insert with check (auth.uid() = user_id);
create policy "weight_update_own" on weight for update using (auth.uid() = user_id);
create policy "weight_delete_own" on weight for delete using (auth.uid() = user_id);

create policy "water_select_own" on water_intake for select using (auth.uid() = user_id);
create policy "water_insert_own" on water_intake for insert with check (auth.uid() = user_id);
create policy "water_update_own" on water_intake for update using (auth.uid() = user_id);
create policy "water_delete_own" on water_intake for delete using (auth.uid() = user_id);

create policy "settings_select_own" on settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on settings for update using (auth.uid() = user_id);

create policy "ai_usage_select_own" on ai_usage for select using (auth.uid() = user_id);
create policy "ai_usage_insert_own" on ai_usage for insert with check (auth.uid() = user_id);
create policy "ai_usage_update_own" on ai_usage for update using (auth.uid() = user_id);
