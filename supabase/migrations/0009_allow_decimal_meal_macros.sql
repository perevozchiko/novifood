-- Voice and product-based entries calculate macros to one decimal place.
-- Preserve that precision instead of rejecting values such as 28.2 g.
alter table meals
  alter column protein type real using protein::real,
  alter column fat type real using fat::real,
  alter column carbs type real using carbs::real;
