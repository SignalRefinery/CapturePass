-- Allow custom profile themes for business individual plans.
--
-- Business individual accounts already use the custom theme UI in the app.
-- This migration extends the database entitlement check so saving custom
-- colors no longer fails for that plan.

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select case coalesce(theme_key, 'taptagg_brand')
    when 'taptagg_brand' then true
    when 'executive_navy' then true
    when 'modern_slate' then plan_key in ('core', 'tagg_plus', 'creator', 'business', 'business_individual')
    when 'clean_horizon' then plan_key in ('core', 'tagg_plus', 'creator', 'business', 'business_individual')
    when 'executive_gold' then plan_key in ('tagg_plus', 'creator', 'business', 'business_individual')
    when 'sage_professional' then plan_key in ('tagg_plus', 'creator', 'business', 'business_individual')
    when 'custom' then plan_key in ('creator', 'business', 'business_individual')
    else false
  end
$$;

comment on function public.profile_theme_allowed(text, text)
is 'Returns whether a theme is allowed for the resolved plan, including business individual custom themes.';
