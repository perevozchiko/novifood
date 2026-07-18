-- A personal product is identified by its owner and normalized name. Voice/AI
-- entries have no barcode, so repeated confirmations used to create duplicates.

alter table user_products
  add column if not exists name_key text;

update user_products
  set name_key = lower(regexp_replace(btrim(name), '\\s+', ' ', 'g'))
  where name_key is null;

-- Keep the most recently edited copy of each existing duplicate before adding
-- the uniqueness rule. They are duplicate catalogue entries, not diary meals.
with ranked_duplicates as (
  select id,
    row_number() over (
      partition by user_id, name_key
      order by updated_at desc, created_at desc, id desc
    ) as row_number
  from user_products
)
delete from user_products
where id in (
  select id from ranked_duplicates where row_number > 1
);

alter table user_products
  alter column name_key set not null;

create unique index if not exists user_products_user_name_key_unique
  on user_products (user_id, name_key);

create or replace function public.set_user_product_name_key()
returns trigger
language plpgsql
as $$
begin
  new.name_key := lower(regexp_replace(btrim(new.name), '\\s+', ' ', 'g'));
  return new;
end;
$$;

drop trigger if exists set_user_product_name_key on user_products;
create trigger set_user_product_name_key
  before insert or update of name on user_products
  for each row execute function public.set_user_product_name_key();
