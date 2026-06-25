-- NoviFood migration 002: water intake tracking.

-- ─── water_intake ─────────────────────────────────────────────────────────────
create table water_intake (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now(),
  logged_at  timestamptz not null    default now(),
  amount_ml  integer     not null    check (amount_ml > 0)
);

-- ─── settings: add daily water goal ──────────────────────────────────────────
alter table settings
  add column if not exists water_goal_ml integer not null default 2000;

-- Populate existing row.
update settings set water_goal_ml = 2000 where id = 1;
