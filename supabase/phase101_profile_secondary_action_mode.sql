-- Expand the main profile secondary action into call, text, email, or none.
--
-- Existing rows are backfilled from the legacy show_text flag so older
-- profiles keep their current behavior until they are edited in the app.

alter table public.profiles
  add column if not exists secondary_action_mode text;

update public.profiles
set secondary_action_mode = case
  when secondary_action_mode is not null then secondary_action_mode
  when show_text is true then 'text'
  when show_text is false then 'email'
  else 'none'
end;

comment on column public.profiles.secondary_action_mode
is 'Secondary hero action mode: call, text, email, or none.';

drop function if exists public.get_public_profile_by_slug(text);
drop function if exists public.get_public_profile_by_token(text);

create or replace function public.get_public_profile_by_slug(profile_slug text)
returns table (
  id uuid,
  user_id uuid,
  slug text,
  business_type text,
  page_mode text,
  multi_view_display_mode text,
  default_view_id uuid,
  full_name text,
  organization_name text,
  role_line text,
  intro text,
  email text,
  phone text,
  text_phone text,
  website_url text,
  show_text boolean,
  secondary_action_mode text,
  theme_key text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_color_background text,
  brand_color_text text,
  brand_logo_url text,
  profile_badge_1 text,
  profile_badge_2 text,
  profile_badge_3 text,
  primary_link_1_title text,
  primary_link_1_url text,
  primary_link_1_type text,
  primary_link_2_title text,
  primary_link_2_url text,
  primary_link_2_type text,
  primary_link_3_title text,
  primary_link_3_url text,
  primary_link_3_type text,
  primary_link_4_title text,
  primary_link_4_url text,
  primary_link_4_type text,
  is_active boolean,
  stripe_plan_key text,
  billing_exempt boolean,
  lifetime_free boolean,
  promo_code_used text,
  slug_status text,
  consent_public_visibility boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    p.slug,
    p.business_type,
    p.page_mode,
    p.multi_view_display_mode,
    p.default_view_id,
    p.full_name,
    p.organization_name,
    p.role_line,
    p.intro,
    p.email,
    p.phone,
    p.text_phone,
    p.website_url,
    p.show_text,
    p.secondary_action_mode,
    p.theme_key,
    p.brand_color_primary,
    p.brand_color_secondary,
    p.brand_color_accent,
    p.brand_color_background,
    p.brand_color_text,
    p.brand_logo_url,
    p.profile_badge_1,
    p.profile_badge_2,
    p.profile_badge_3,
    p.primary_link_1_title,
    p.primary_link_1_url,
    p.primary_link_1_type,
    p.primary_link_2_title,
    p.primary_link_2_url,
    p.primary_link_2_type,
    p.primary_link_3_title,
    p.primary_link_3_url,
    p.primary_link_3_type,
    p.primary_link_4_title,
    p.primary_link_4_url,
    p.primary_link_4_type,
    true as is_active,
    coalesce(
      nullif(p.stripe_plan_key, ''),
      case
        when coalesce(p.billing_exempt, false)
          or coalesce(p.lifetime_free, false)
          or upper(coalesce(p.promo_code_used, '')) = 'FOUNDERS'
        then 'creator'
        else 'core'
      end
    ) as stripe_plan_key,
    false as billing_exempt,
    false as lifetime_free,
    null::text as promo_code_used,
    'approved'::text as slug_status,
    true as consent_public_visibility
  from public.profiles p
  where lower(p.slug) = lower(profile_slug)
    and p.is_active = true
    and p.consent_public_visibility = true
    and p.slug_status = 'approved'
    and not public.slug_is_blocked_db(p.slug)
  limit 1;
$$;

create or replace function public.get_public_profile_by_token(profile_token text)
returns table (
  id uuid,
  user_id uuid,
  slug text,
  business_type text,
  page_mode text,
  multi_view_display_mode text,
  default_view_id uuid,
  full_name text,
  organization_name text,
  role_line text,
  intro text,
  email text,
  phone text,
  text_phone text,
  website_url text,
  show_text boolean,
  secondary_action_mode text,
  theme_key text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_color_background text,
  brand_color_text text,
  brand_logo_url text,
  profile_badge_1 text,
  profile_badge_2 text,
  profile_badge_3 text,
  primary_link_1_title text,
  primary_link_1_url text,
  primary_link_1_type text,
  primary_link_2_title text,
  primary_link_2_url text,
  primary_link_2_type text,
  primary_link_3_title text,
  primary_link_3_url text,
  primary_link_3_type text,
  primary_link_4_title text,
  primary_link_4_url text,
  primary_link_4_type text,
  is_active boolean,
  stripe_plan_key text,
  billing_exempt boolean,
  lifetime_free boolean,
  promo_code_used text,
  slug_status text,
  consent_public_visibility boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    p.slug,
    p.business_type,
    p.page_mode,
    p.multi_view_display_mode,
    p.default_view_id,
    p.full_name,
    p.organization_name,
    p.role_line,
    p.intro,
    p.email,
    p.phone,
    p.text_phone,
    p.website_url,
    p.show_text,
    p.secondary_action_mode,
    p.theme_key,
    p.brand_color_primary,
    p.brand_color_secondary,
    p.brand_color_accent,
    p.brand_color_background,
    p.brand_color_text,
    p.brand_logo_url,
    p.profile_badge_1,
    p.profile_badge_2,
    p.profile_badge_3,
    p.primary_link_1_title,
    p.primary_link_1_url,
    p.primary_link_1_type,
    p.primary_link_2_title,
    p.primary_link_2_url,
    p.primary_link_2_type,
    p.primary_link_3_title,
    p.primary_link_3_url,
    p.primary_link_3_type,
    p.primary_link_4_title,
    p.primary_link_4_url,
    p.primary_link_4_type,
    true as is_active,
    coalesce(
      nullif(p.stripe_plan_key, ''),
      case
        when coalesce(p.billing_exempt, false)
          or coalesce(p.lifetime_free, false)
          or upper(coalesce(p.promo_code_used, '')) = 'FOUNDERS'
        then 'creator'
        else 'core'
      end
    ) as stripe_plan_key,
    false as billing_exempt,
    false as lifetime_free,
    null::text as promo_code_used,
    'approved'::text as slug_status,
    coalesce(p.consent_public_visibility, false) as consent_public_visibility
  from public.profiles p
  where p.private_token = profile_token
    and p.is_active = true
    and p.slug_status = 'approved'
    and not public.slug_is_blocked_db(p.slug)
  limit 1;
$$;

revoke all on function public.get_public_profile_by_slug(text) from public;
revoke all on function public.get_public_profile_by_token(text) from public;
grant execute on function public.get_public_profile_by_slug(text) to anon, authenticated, service_role;
grant execute on function public.get_public_profile_by_token(text) to anon, authenticated, service_role;

comment on function public.get_public_profile_by_slug(text)
is 'Returns the limited public profile payload for active, visible, approved slug pages, including secondary button mode.';

comment on function public.get_public_profile_by_token(text)
is 'Returns the limited public profile payload for active, approved issued-token pages without exposing private_token.';
