alter table public.profiles
  add column if not exists consent_public_visibility boolean not null default false;
