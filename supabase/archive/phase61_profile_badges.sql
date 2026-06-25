alter table public.profiles
  add column if not exists profile_badge_1 text not null default '',
  add column if not exists profile_badge_2 text not null default '',
  add column if not exists profile_badge_3 text not null default '';

alter table public.profile_views
  add column if not exists profile_badge_1 text not null default '',
  add column if not exists profile_badge_2 text not null default '',
  add column if not exists profile_badge_3 text not null default '';
