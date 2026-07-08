-- CapturePass existing-project default cleanup.
--
-- Use this if the consolidated fresh-project schema was accidentally applied
-- to an already-migrated database and you need to restore the older defaults
-- that the app expects for upgraded projects.

alter table public.organizations
  alter column theme_key set default 'capturepass_brand';

alter table public.profiles
  alter column consent_public_visibility set default true;

alter table public.profile_views
  alter column show_text set default true,
  alter column show_text drop not null;

-- Optional verification:
-- select
--   (select column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'organizations' and column_name = 'theme_key') as organizations_theme_key_default,
--   (select column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'profiles' and column_name = 'consent_public_visibility') as profiles_consent_public_visibility_default,
--   (select column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'profile_views' and column_name = 'show_text') as profile_views_show_text_default,
--   (select is_nullable from information_schema.columns
--    where table_schema = 'public' and table_name = 'profile_views' and column_name = 'show_text') as profile_views_show_text_nullable;

