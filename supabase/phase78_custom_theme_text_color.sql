-- Custom theme text color.
--
-- Adds a text color for custom profile/business themes so light custom
-- palettes can remain readable.

alter table public.profiles
  add column if not exists brand_color_text text;

alter table public.organizations
  add column if not exists brand_color_text text;

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

comment on column public.profiles.brand_color_text
is 'Custom theme text color. Used only when theme_key is custom.';

comment on column public.organizations.brand_color_text
is 'Custom business theme text color. Used only when theme_key is custom.';
