-- Remove plan-based theme gating for profile themes.
--
-- All valid themes remain available to every profile plan. The trigger still
-- clears custom color fields for non-custom themes.

create or replace function public.profile_theme_allowed(theme_key text, plan_key text)
returns boolean
language sql
stable
as $$
  select coalesce(theme_key, 'capturepass_brand') in (
    'capturepass_brand',
    'tt_classic',
    'modern_slate',
    'executive_gold',
    'clean_horizon',
    'modern_rose',
    'custom',
    'executive_navy',
    'sage_professional',
    'arctic_white',
    'ivory_executive',
    'coastal_blue',
    'emerald_executive',
    'sandstone'
  )
$$;
