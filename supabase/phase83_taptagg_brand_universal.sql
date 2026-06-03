-- TapTagg Brand universal access.
--
-- Reasserts that the TapTagg Brand theme is available on every plan, including
-- Creator, so existing databases with older theme-gating state can recover.

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

comment on function public.profile_theme_allowed(text, text)
is 'Allows the TapTagg Brand theme for all plans while keeping other theme presets plan-gated.';
