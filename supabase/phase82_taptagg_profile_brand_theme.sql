-- TapTagg profile brand theme.
--
-- Restores the TapTagg purple palette as the default for personal profiles
-- without changing the business organization theme presets.

alter table public.profiles
  alter column theme_key set default 'taptagg_brand';

alter table public.profiles
  drop constraint if exists profiles_theme_key_check;

update public.profiles
set theme_key = 'taptagg_brand'
where coalesce(theme_key, '') in ('', 'executive_navy');

alter table public.profiles
  add constraint profiles_theme_key_check
  check (theme_key in ('taptagg_brand', 'executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'));

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select case coalesce(theme_key, 'taptagg_brand')
    when 'taptagg_brand' then true
    when 'executive_navy' then true
    when 'modern_slate' then plan_key in ('core', 'tagg_plus', 'creator', 'business')
    when 'clean_horizon' then plan_key in ('core', 'tagg_plus', 'creator', 'business')
    when 'executive_gold' then plan_key in ('tagg_plus', 'creator', 'business')
    when 'sage_professional' then plan_key in ('tagg_plus', 'creator', 'business')
    when 'custom' then plan_key in ('creator', 'business')
    else false
  end
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
  new.theme_key := coalesce(nullif(new.theme_key, ''), 'taptagg_brand');
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
    new.brand_color_text := null;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_theme_entitlement on public.profiles;
create trigger enforce_profile_theme_entitlement
before insert or update of theme_key, brand_color_primary, brand_color_secondary, brand_color_accent, brand_color_text, stripe_plan_key, is_active, billing_exempt, lifetime_free, promo_code_used, is_admin
on public.profiles
for each row
execute function public.enforce_profile_theme_entitlement();
