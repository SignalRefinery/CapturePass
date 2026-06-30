-- Rename the legacy brand theme key and backfill stored rows.
--
-- This makes capturepass_brand the canonical stored value everywhere new data
-- is written while updating existing records and constraints in place.

alter table public.profiles
  alter column theme_key set default 'capturepass_brand';

alter table public.profiles
  drop constraint if exists profiles_theme_key_check;

alter table public.organizations
  drop constraint if exists organizations_theme_key_check;

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select coalesce(theme_key, 'capturepass_brand') in (
    'capturepass_brand',
    'executive_navy',
    'modern_slate',
    'executive_gold',
    'clean_horizon',
    'sage_professional',
    'custom'
  )
$$;

create or replace function public.enforce_profile_theme_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_plan text;
begin
  new.theme_key := coalesce(nullif(new.theme_key, ''), 'capturepass_brand');
  resolved_plan := public.profile_theme_plan_key(
    new.stripe_plan_key,
    new.is_active,
    new.billing_exempt,
    new.lifetime_free,
    new.promo_code_used,
    new.is_admin
  );

  if not public.profile_theme_allowed(new.theme_key, resolved_plan) then
    raise exception 'Theme % is not available for plan %', new.theme_key, resolved_plan
      using errcode = '42501';
  end if;

  if new.theme_key <> 'custom' then
    new.brand_color_primary := null;
    new.brand_color_secondary := null;
    new.brand_color_accent := null;
    new.brand_color_background := null;
    new.brand_color_text := null;
  end if;

  return new;
end;
$$;

update public.profiles
set theme_key = 'capturepass_brand'
where theme_key is null
   or theme_key = ''
   or theme_key = 'taptagg_brand'
   or theme_key not in (
     'capturepass_brand',
     'executive_navy',
     'modern_slate',
     'executive_gold',
     'clean_horizon',
     'sage_professional',
     'custom'
   );

update public.organizations
set theme_key = 'capturepass_brand'
where theme_key is null
   or theme_key = ''
   or theme_key = 'taptagg_brand'
   or theme_key not in (
     'capturepass_brand',
     'executive_navy',
     'modern_slate',
     'executive_gold',
     'clean_horizon',
     'sage_professional',
     'custom'
   );

alter table public.profiles
  add constraint profiles_theme_key_check check (
    theme_key in (
      'capturepass_brand',
      'executive_navy',
      'modern_slate',
      'executive_gold',
      'clean_horizon',
      'sage_professional',
      'custom'
    )
  );

alter table public.organizations
  add constraint organizations_theme_key_check check (
    theme_key in (
      'capturepass_brand',
      'executive_navy',
      'modern_slate',
      'executive_gold',
      'clean_horizon',
      'sage_professional',
      'custom'
    )
  );
