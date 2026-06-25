-- Optional organization/business name for profiles and individual views.
--
-- This is user-editable and included in generated vCards as ORG.

alter table public.profiles
  add column if not exists organization_name text not null default '';

alter table public.profile_views
  add column if not exists organization_name text not null default '';

comment on column public.profiles.organization_name
is 'Optional organization or business name included in profile vCards.';

comment on column public.profile_views.organization_name
is 'Optional organization or business name for this profile view, included in view-aware vCards.';
