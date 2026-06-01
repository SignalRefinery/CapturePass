-- Theme presets and entitlement enforcement.
--
-- Theme identity is stored separately from custom hex colors so preset palettes
-- can improve over time without updating every profile or organization row.

alter table public.profiles
  add column if not exists theme_key text not null default 'executive_navy',
  add column if not exists brand_color_primary text,
  add column if not exists brand_color_secondary text,
  add column if not exists brand_color_accent text;

alter table public.organizations
  add column if not exists theme_key text not null default 'executive_navy';

update public.profiles
set theme_key = 'executive_navy'
where theme_key is null or theme_key = '';

update public.organizations
set theme_key = 'custom'
where coalesce(theme_key, 'executive_navy') = 'executive_navy'
  and (
    brand_color is not null
    or brand_color_primary is not null
    or brand_color_secondary is not null
    or brand_color_accent is not null
    or brand_theme = 'custom'
  );

update public.organizations
set theme_key = 'executive_navy'
where theme_key is null or theme_key = '';

alter table public.profiles
  drop constraint if exists profiles_theme_key_check;

alter table public.profiles
  add constraint profiles_theme_key_check
  check (theme_key in ('executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'));

alter table public.organizations
  drop constraint if exists organizations_theme_key_check;

alter table public.organizations
  add constraint organizations_theme_key_check
  check (theme_key in ('executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'));

create or replace function public.profile_theme_plan_key(
  plan_key text,
  is_active boolean,
  billing_exempt boolean,
  lifetime_free boolean,
  promo_code_used text,
  is_admin boolean
)
returns text
language sql
stable
as $$
  select case
    when coalesce(billing_exempt, false)
      or coalesce(lifetime_free, false)
      or upper(coalesce(promo_code_used, '')) = 'FOUNDERS'
      or coalesce(is_admin, false)
      then coalesce(nullif(plan_key, ''), 'creator')
    when coalesce(is_active, false)
      then coalesce(nullif(plan_key, ''), 'core')
    else 'free'
  end
$$;

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select case coalesce(theme_key, 'executive_navy')
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
  new.theme_key := coalesce(nullif(new.theme_key, ''), 'executive_navy');
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
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_theme_entitlement on public.profiles;
create trigger enforce_profile_theme_entitlement
before insert or update of theme_key, brand_color_primary, brand_color_secondary, brand_color_accent, stripe_plan_key, is_active, billing_exempt, lifetime_free, promo_code_used, is_admin
on public.profiles
for each row
execute function public.enforce_profile_theme_entitlement();

comment on column public.profiles.theme_key
is 'Selected curated theme identifier. Preset colors are resolved by app config; custom colors apply only when theme_key is custom.';

comment on column public.organizations.theme_key
is 'Selected curated business theme identifier. Existing custom palettes migrate to custom.';
