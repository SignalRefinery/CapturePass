-- TapTagg Brand theme constraint fix.
--
-- Rebuilds the profiles theme check constraint so TapTagg Brand is accepted
-- by the database even if an older migration left the live schema behind.

alter table public.profiles
  drop constraint if exists profiles_theme_key_check;

alter table public.profiles
  add constraint profiles_theme_key_check
  check (theme_key in ('taptagg_brand', 'executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'));

comment on constraint profiles_theme_key_check on public.profiles
is 'Allows TapTagg Brand and the approved profile theme presets.';
