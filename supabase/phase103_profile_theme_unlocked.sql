-- Remove plan-based theme gating for profile themes.
--
-- All valid themes remain available to every profile plan. The trigger still
-- clears custom color fields for non-custom themes.

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select coalesce(theme_key, 'taptagg_brand') in (
    'taptagg_brand',
    'executive_navy',
    'modern_slate',
    'executive_gold',
    'clean_horizon',
    'sage_professional',
    'custom'
  )
$$;
