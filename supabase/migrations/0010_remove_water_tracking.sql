-- NoviFood migration 010: remove water tracking and its stored data.

drop table if exists public.water_intake;

alter table public.settings
  drop column if exists water_goal_ml;
