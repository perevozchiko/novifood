-- NoviFood initial schema.
-- Single-user app — no RLS, no auth.users references.

-- ─── meals ────────────────────────────────────────────────────────────────────
create table meals (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  eaten_at    timestamptz not null    default now(),
  name        text        not null,
  meal_type   text,                    -- breakfast | lunch | dinner | snack
  calories    integer     not null    default 0,
  protein     real        not null    default 0,
  fat         real        not null    default 0,
  carbs       real        not null    default 0,
  notes       text
);

-- ─── settings ─────────────────────────────────────────────────────────────────
-- Single row, always id = 1.
create table settings (
  id              integer primary key default 1 check (id = 1),
  calorie_goal    integer not null default 2200,
  protein_goal    integer not null default 150,
  fat_goal        integer not null default 80,
  carbs_goal      integer not null default 250
);

insert into settings (id, calorie_goal, protein_goal, fat_goal, carbs_goal)
values (1, 2200, 150, 80, 250)
on conflict (id) do nothing;

-- ─── weight ───────────────────────────────────────────────────────────────────
create table weight (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  value       numeric     not null
);
