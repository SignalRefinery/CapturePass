-- Profile CTA button support.
--
-- Adds structured button types alongside the existing primary link fields so
-- profiles can render typed CTAs without breaking older data.

alter table public.profiles
  add column if not exists primary_link_1_type text,
  add column if not exists primary_link_2_type text,
  add column if not exists primary_link_3_type text,
  add column if not exists primary_link_4_type text;

alter table public.profile_views
  add column if not exists primary_link_1_type text,
  add column if not exists primary_link_2_type text,
  add column if not exists primary_link_3_type text,
  add column if not exists primary_link_4_type text;

update public.profiles
set
  primary_link_1_type = coalesce(primary_link_1_type, 'website'),
  primary_link_2_type = coalesce(primary_link_2_type, 'website'),
  primary_link_3_type = coalesce(primary_link_3_type, 'website'),
  primary_link_4_type = coalesce(primary_link_4_type, 'website')
where
  primary_link_1_type is null
  or primary_link_2_type is null
  or primary_link_3_type is null
  or primary_link_4_type is null
  or primary_link_1_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_2_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_3_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_4_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom');

update public.profile_views
set
  primary_link_1_type = coalesce(primary_link_1_type, 'website'),
  primary_link_2_type = coalesce(primary_link_2_type, 'website'),
  primary_link_3_type = coalesce(primary_link_3_type, 'website'),
  primary_link_4_type = coalesce(primary_link_4_type, 'website')
where
  primary_link_1_type is null
  or primary_link_2_type is null
  or primary_link_3_type is null
  or primary_link_4_type is null
  or primary_link_1_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_2_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_3_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  or primary_link_4_type not in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom');

alter table public.profiles
  alter column primary_link_1_type set default 'website',
  alter column primary_link_2_type set default 'website',
  alter column primary_link_3_type set default 'website',
  alter column primary_link_4_type set default 'website';

alter table public.profile_views
  alter column primary_link_1_type set default 'website',
  alter column primary_link_2_type set default 'website',
  alter column primary_link_3_type set default 'website',
  alter column primary_link_4_type set default 'website';

alter table public.profiles
  alter column primary_link_1_type set not null,
  alter column primary_link_2_type set not null,
  alter column primary_link_3_type set not null,
  alter column primary_link_4_type set not null;

alter table public.profile_views
  alter column primary_link_1_type set not null,
  alter column primary_link_2_type set not null,
  alter column primary_link_3_type set not null,
  alter column primary_link_4_type set not null;

alter table public.profiles
  drop constraint if exists profiles_primary_link_1_type_check,
  drop constraint if exists profiles_primary_link_2_type_check,
  drop constraint if exists profiles_primary_link_3_type_check,
  drop constraint if exists profiles_primary_link_4_type_check;

alter table public.profile_views
  drop constraint if exists profile_views_primary_link_1_type_check,
  drop constraint if exists profile_views_primary_link_2_type_check,
  drop constraint if exists profile_views_primary_link_3_type_check,
  drop constraint if exists profile_views_primary_link_4_type_check;

alter table public.profiles
  add constraint profiles_primary_link_1_type_check check (primary_link_1_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profiles_primary_link_2_type_check check (primary_link_2_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profiles_primary_link_3_type_check check (primary_link_3_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profiles_primary_link_4_type_check check (primary_link_4_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom'));

alter table public.profile_views
  add constraint profile_views_primary_link_1_type_check check (primary_link_1_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profile_views_primary_link_2_type_check check (primary_link_2_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profile_views_primary_link_3_type_check check (primary_link_3_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')),
  add constraint profile_views_primary_link_4_type_check check (primary_link_4_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom'));

comment on column public.profiles.primary_link_1_type is 'CTA button type for the first primary link.';
comment on column public.profiles.primary_link_2_type is 'CTA button type for the second primary link.';
comment on column public.profiles.primary_link_3_type is 'CTA button type for the third primary link.';
comment on column public.profiles.primary_link_4_type is 'CTA button type for the fourth primary link.';
comment on column public.profile_views.primary_link_1_type is 'CTA button type for the first primary link.';
comment on column public.profile_views.primary_link_2_type is 'CTA button type for the second primary link.';
comment on column public.profile_views.primary_link_3_type is 'CTA button type for the third primary link.';
comment on column public.profile_views.primary_link_4_type is 'CTA button type for the fourth primary link.';
