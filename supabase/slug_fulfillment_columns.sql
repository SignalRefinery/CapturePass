alter table public.profiles
  add column if not exists shipping_name text,
  add column if not exists shipping_address_line1 text,
  add column if not exists shipping_address_line2 text,
  add column if not exists shipping_city text,
  add column if not exists shipping_state text,
  add column if not exists shipping_postal_code text,
  add column if not exists shipping_country text;

update public.profiles
set slug_status = 'approved'
where slug_status is null;
