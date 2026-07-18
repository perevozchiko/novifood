-- Store the actual amount eaten separately from nutrition totals so it can be
-- shown in the diary and remains editable without changing the meal name.
alter table meals
  add column if not exists weight_grams real;

alter table meals
  drop constraint if exists meals_weight_grams_positive;

alter table meals
  add constraint meals_weight_grams_positive
  check (weight_grams is null or weight_grams > 0);
