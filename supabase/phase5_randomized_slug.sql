alter table public.profiles
  add column if not exists private_token text unique;

update public.profiles
set private_token = substr(md5(random()::text), 1, 7)
where private_token is null;
