alter table public.profiles
  add column if not exists slug_status text not null default 'approved',
  add column if not exists slug_requested text,
  add column if not exists slug_review_reason text;

create index if not exists profiles_slug_status_idx on public.profiles (slug_status);
create index if not exists profiles_slug_requested_idx on public.profiles (slug_requested);

update public.profiles
set slug_status = 'approved'
where slug_status is null;

create unique index if not exists profiles_slug_requested_unique_idx
on public.profiles (slug_requested)
where slug_requested is not null;
