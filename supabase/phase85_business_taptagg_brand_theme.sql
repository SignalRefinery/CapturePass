-- Business TapTagg Brand theme support.
--
-- Allows organizations to select the TapTagg Brand theme and keeps the
-- database constraint aligned with the updated business theme picker.

alter table public.organizations
  drop constraint if exists organizations_theme_key_check;

alter table public.organizations
  add constraint organizations_theme_key_check
  check (theme_key in ('taptagg_brand', 'executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'));

comment on constraint organizations_theme_key_check on public.organizations
is 'Allows TapTagg Brand and the approved business theme presets.';
