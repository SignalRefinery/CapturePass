alter table public.profile_views
  add column if not exists show_in_public_nav boolean;

update public.profile_views
set show_in_public_nav = true
where show_in_public_nav is null;

alter table public.profile_views
  alter column show_in_public_nav set default true,
  alter column show_in_public_nav set not null;
