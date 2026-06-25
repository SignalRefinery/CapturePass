-- CapturePass consolidated Supabase schema for a fresh project.
-- Generated from the current bootstrap plus later feature phases.

-- ============================================================
-- Source: supabase/bootstrap.sql
-- ============================================================

-- TapTagg fresh Supabase project bootstrap.
--
-- Run this once in the Supabase SQL editor for a new project. Existing
-- phase*.sql files remain available for incremental upgrades of older
-- databases.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  slug text unique not null,
  private_token text unique,
  business_type text not null default 'general_business',
  page_mode text not null default 'single',
  multi_view_display_mode text not null default 'favorite',
  default_view_id uuid,
  full_name text not null default '',
  organization_name text not null default '',
  role_line text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  text_phone text not null default '',
  website_url text not null default '',
  show_text boolean default true,
  theme_key text not null default 'taptagg_brand',
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_color_background text,
  brand_color_text text,
  brand_logo_url text,
  profile_badge_1 text not null default '',
  profile_badge_2 text not null default '',
  profile_badge_3 text not null default '',
  primary_link_1_title text not null default 'Call',
  primary_link_1_url text not null default '',
  primary_link_1_type text not null default 'website',
  primary_link_2_title text not null default 'Email',
  primary_link_2_url text not null default '',
  primary_link_2_type text not null default 'website',
  primary_link_3_title text not null default 'Website',
  primary_link_3_url text not null default '',
  primary_link_3_type text not null default 'website',
  primary_link_4_title text not null default 'Website',
  primary_link_4_url text not null default '',
  primary_link_4_type text not null default 'website',
  constraint profiles_primary_link_types_check check (
    primary_link_1_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_2_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_3_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_4_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  ),
  is_active boolean not null default false,
  is_admin boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_plan_key text,
  subscription_status text,
  subscription_current_period_end timestamptz,
  current_period_end timestamptz,
  referral_code text,
  referred_by text,
  referral_code_used text,
  referral_reconciled boolean not null default false,
  referral_reconciled_at timestamptz,
  referral_reconciled_by text,
  is_affiliate boolean not null default false,
  affiliate_tier text,
  billing_exempt boolean not null default false,
  lifetime_free boolean not null default false,
  promo_code_used text,
  is_public_official boolean not null default false,
  slug_status text not null default 'approved',
  slug_requested text,
  slug_review_reason text,
  consent_public_visibility boolean not null default true,
  shipping_name text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  registration_notification_sent_at timestamptz,
  card_notification_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_page_mode_check check (page_mode in ('single', 'multi')),
  constraint profiles_multi_view_display_mode_check check (multi_view_display_mode in ('landing', 'favorite')),
  constraint profiles_business_type_check check (
    business_type in (
      'automotive_dealership',
      'real_estate_brokerage',
      'insurance_agency',
      'mortgage_lender',
      'staffing_recruiting',
      'financial_advisor',
      'general_business'
    )
  ),
  constraint profiles_slug_status_check check (slug_status in ('approved', 'pending_review', 'rejected')),
  constraint profiles_theme_key_check check (theme_key in ('taptagg_brand', 'executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom'))
);

create unique index if not exists profiles_user_id_idx on public.profiles (user_id);
create unique index if not exists profiles_slug_idx on public.profiles (slug);
create unique index if not exists profiles_referral_code_idx on public.profiles (referral_code);
create unique index if not exists profiles_slug_requested_unique_idx
on public.profiles (slug_requested)
where slug_requested is not null;
create index if not exists profiles_slug_status_idx on public.profiles (slug_status);
create index if not exists profiles_public_lower_slug_lookup_idx
on public.profiles (lower(slug))
where is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved';
create index if not exists profiles_public_private_token_lookup_idx
on public.profiles (private_token)
where private_token is not null
  and is_active = true
  and slug_status = 'approved';
create index if not exists profiles_active_approved_public_idx
on public.profiles (id)
where is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved';

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Main View',
  view_key text not null,
  sort_order integer not null default 0,
  full_name text not null default '',
  organization_name text not null default '',
  role_line text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  text_phone text not null default '',
  website_url text not null default '',
  profile_badge_1 text not null default '',
  profile_badge_2 text not null default '',
  profile_badge_3 text not null default '',
  show_email boolean not null default true,
  show_phone boolean not null default true,
  show_text boolean,
  show_in_public_nav boolean not null default true,
  primary_link_1_title text not null default '',
  primary_link_1_url text not null default '',
  primary_link_1_type text not null default 'website',
  primary_link_2_title text not null default '',
  primary_link_2_url text not null default '',
  primary_link_2_type text not null default 'website',
  primary_link_3_title text not null default '',
  primary_link_3_url text not null default '',
  primary_link_3_type text not null default 'website',
  primary_link_4_title text not null default '',
  primary_link_4_url text not null default '',
  primary_link_4_type text not null default 'website',
  constraint profile_views_primary_link_types_check check (
    primary_link_1_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_2_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_3_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
    and primary_link_4_type in ('website', 'email', 'phone', 'text', 'booking', 'directions', 'pdf', 'payment', 'custom')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profile_views_profile_id_view_key_key unique (profile_id, view_key)
);

create index if not exists profile_views_profile_id_sort_order_idx
on public.profile_views (profile_id, sort_order);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text,
  target_user_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  business_type text not null default 'general_business',
  brand_color text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_color_background text,
  brand_color_text text,
  theme_key text not null default 'executive_navy',
  brand_theme text not null default 'full_color',
  brand_logo_url text,
  business_link_1_title text,
  business_link_1_url text,
  business_link_2_title text,
  business_link_2_url text,
  business_link_3_title text,
  business_link_3_url text,
  business_link_4_title text,
  business_link_4_url text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  managed_service_enabled boolean not null default false,
  business_plan_key text,
  business_billing_interval text not null default 'monthly',
  seat_limit integer,
  included_card_count integer,
  is_managed boolean not null default false,
  setup_fee_paid_at timestamptz,
  card_allotment_total integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organizations_business_plan_key_check check (
    business_plan_key is null
    or business_plan_key in (
      'business_starter_self',
      'business_starter_managed',
      'business_growth_self',
      'business_growth_managed',
      'business_pro_self',
      'business_pro_managed'
    )
  ),
  constraint organizations_business_billing_interval_check check (business_billing_interval in ('monthly', 'annual')),
  constraint organizations_business_type_check check (
    business_type in (
      'automotive_dealership',
      'real_estate_brokerage',
      'insurance_agency',
      'mortgage_lender',
      'staffing_recruiting',
      'financial_advisor',
      'general_business'
    )
  ),
  constraint organizations_business_capacity_check check (
    (seat_limit is null or seat_limit > 0)
    and (included_card_count is null or included_card_count >= 0)
    and (card_allotment_total is null or card_allotment_total >= 0)
  ),
  constraint organizations_theme_key_check check (theme_key in ('taptagg_brand', 'executive_navy', 'modern_slate', 'executive_gold', 'clean_horizon', 'sage_professional', 'custom')),
  constraint organizations_brand_theme_check check (brand_theme in ('deep_brand', 'clean_light', 'full_color', 'custom'))
);

create table if not exists public.business_regions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  state_codes text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text,
  address text,
  city text,
  state text,
  phone text,
  region_id uuid references public.business_regions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null default '',
  email text,
  headshot_url text,
  phone text,
  title text,
  role text not null default 'member',
  location_id uuid references public.business_locations(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_members_role_check check (role in ('owner', 'admin', 'member', 'super_admin', 'business_admin', 'location_admin', 'employee')),
  constraint organization_members_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.pass_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  token text unique not null,
  assigned_member_id uuid references public.organization_members(id) on delete set null,
  status text not null default 'unassigned',
  token_type text not null default 'both',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pass_tokens_status_check check (status in ('active', 'inactive', 'unassigned')),
  constraint pass_tokens_token_type_check check (token_type in ('nfc_card', 'digital_pass', 'both'))
);

create index if not exists organization_members_organization_id_idx
on public.organization_members (organization_id);

create index if not exists organization_members_location_id_idx
on public.organization_members (location_id);

create index if not exists pass_tokens_organization_id_idx
on public.pass_tokens (organization_id);

create index if not exists pass_tokens_assigned_member_id_idx
on public.pass_tokens (assigned_member_id);

create unique index if not exists business_regions_business_id_name_idx
on public.business_regions (business_id, name);

create index if not exists business_regions_business_id_idx
on public.business_regions (business_id, created_at desc);

create index if not exists business_locations_business_id_idx
on public.business_locations (business_id, created_at desc);

create unique index if not exists business_locations_business_id_slug_idx
on public.business_locations (business_id, slug)
where slug is not null;

create index if not exists business_locations_region_id_idx
on public.business_locations (region_id, created_at desc);

create or replace function public.normalize_slug_candidate(input text)
returns text
language plpgsql
as $$
declare
  value text;
begin
  value := lower(coalesce(input, ''));
  value := regexp_replace(value, '[^a-z0-9]+', '-', 'g');
  value := regexp_replace(value, '-{2,}', '-', 'g');
  value := regexp_replace(value, '(^-|-$)', '', 'g');
  return value;
end;
$$;

create or replace function public.slug_abuse_normalized_db(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(lower(coalesce(input, '')), '0', 'o'),
                    '1', 'i'),
                  '3', 'e'),
                '4', 'a'),
              '5', 's'),
            '7', 't'),
          '@', 'a'),
        '$', 's'),
      '!', 'i'),
    '+', 't'),
    '[^a-z0-9]',
    '',
    'g'
  );
$$;

create or replace function public.slug_is_blocked_db(input text)
returns boolean
language plpgsql
as $$
declare
  slug text := public.normalize_slug_candidate(input);
  normalized text := public.slug_abuse_normalized_db(input);
begin
  if slug is null or slug = '' then return true; end if;
  if length(slug) < 3 or length(slug) > 40 then return true; end if;

  if slug in (
    'about','abuse','account','accounts','admin','admin-support','affiliate','affiliates',
    'api','billing','careers','cdn','cms','contact','dashboard','demo','email','example',
    'favicon','founder','founders','ftp','help','home','hostmaster','how-it-works','imap',
    'index','info','js','legal','live-demo','livedemo','localhost','login','mail','media',
    'netlify','noreply','null','official','owner','partner','partners','payments','policy',
    'pop','postmaster','press','preview','pricing','privacy','private','public','resend',
    'robots','root','sales','security','signup','sitemap','smtp','staff','stripe',
    'support','supabase','system','taptagg','team','terms','undefined','verify',
    'verification','webmail','www'
  ) then return true; end if;

  if slug like 'admin%' or slug like 'api%' or slug like 'billing%' or slug like 'official%'
     or slug like 'security%' or slug like 'staff%' or slug like 'support%'
     or slug like 'taptagg%' then
    return true;
  end if;

  if exists (
    select 1
    from unnest(array[
      'asshole','bastard','bitch','bollocks','bullshit','cocksucker','douchebag',
      'fucker','fucking','motherfucker','pervert','retard','beaner','wetback',
      'chink','gook','nigga','nigger','kike','neonazi','hitler','swastika',
      'raghead','towelhead','redskin','whitepower','whitesupremacy'
    ]) as term
    where normalized = term or normalized like '%' || term || '%'
  ) then
    return true;
  end if;

  if normalized in (
    'cock','coon','cunt','damn','dick','dyke','fag','fuck','jap','kkk','klan',
    'nazi','penis','perv','piss','prick','pussy','shit','slut','spic','twat','whore'
  ) then return true; end if;

  if normalized like '%heilhitler%'
     or normalized like '%killjews%'
     or normalized like '%killblack%'
     or normalized like '%killmuslims%'
     or normalized like '%killgays%' then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.slug_requires_review_db(input text)
returns boolean
language plpgsql
as $$
declare
  normalized text := public.slug_abuse_normalized_db(input);
begin
  if normalized = '' then return false; end if;

  if exists (
    select 1
    from unnest(array[
      'alderman','alderwoman','assemblyman','assemblymember','assemblyperson','assemblywoman',
      'boardmember','chair','chairman','chairperson','chairwoman','commissioner','congress',
      'congressman','congressmember','congressperson','congresswoman','council','councilman',
      'councilmember','councilperson','councilwoman','delegate','governor','judge','justice',
      'lieutenantgovernor','ltgovernor','mayor','mp','parliament','president','primeminister',
      'rep','representative','senator','speaker','spokesperson','supervisor','trustee',
      'vicepresident','administrator','agency','assessor','attorneygeneral','auditor','cabinet',
      'chief','citymanager','clerk','comptroller','controller','countyexecutive','deputy',
      'director','executive','inspector','inspectorgeneral','manager','ombudsman','registrar',
      'secretary','treasurer','attorney','court','da','districtattorney','hearingofficer',
      'magistrate','prosecutor','publicdefender','statesattorney','tribunal','captain',
      'chiefdeputy','constable','coroner','detective','ems','fire','firechief','firedepartment',
      'firefighter','firstresponder','lawenforcement','marshal','officer','police','policechief',
      'policedepartment','ranger','sheriff','trooper','undersheriff','warden','boardofeducation',
      'chancellor','principal','schoolboard','schooldistrict','superintendent','bureau','city',
      'cityhall','cityof','county','countyof','civic','department','dept','federal','gov',
      'government','municipal','municipality','officeof','officialaccount','officialpage',
      'publicauthority','publicoffice','state','stateof','town','township','village','ballot',
      'campaign','campaignteam','campaignoffice','candidate','committee','election','elect',
      'reelect','reelection','vote','actual','authentic','certified','confirmed','legit','real',
      'theofficial','true','verified'
    ]) as term
    where normalized = term or normalized like term || '%'
  ) then
    return true;
  end if;

  if exists (
    select 1
    from unnest(array[
      'foralderman','foralderwoman','forassembly','forcommissioner','forcongress',
      'forcongressperson','forcouncil','fordelegate','forgovernor','forjudge','formayor',
      'foroffice','forpresident','forrep','forrepresentative','forsenate','forsenator',
      'forsheriff','fortreasurer','official','officialaccount','officialsite','verified',
      'verifiedaccount','realaccount','office','team','thisis','iam','theofficial','vote',
      'elect','reelect','cityof','countyof','stateof','police','sheriff','governor',
      'senator','mayor','president','gov','government'
    ]) as term
    where normalized like '%' || term || '%'
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.generate_profile_slug(base_slug text, user_uuid uuid)
returns text
language plpgsql
as $$
declare
  candidate text := public.normalize_slug_candidate(base_slug);
begin
  if candidate is null or candidate = '' then
    candidate := 'profile-' || left(replace(user_uuid::text, '-', ''), 8);
  end if;

  if not exists(select 1 from public.profiles where slug = candidate) then
    return candidate;
  end if;

  return candidate || '-' || left(replace(user_uuid::text, '-', ''), 8);
end;
$$;

create or replace function public.generate_safe_profile_slug(user_email text, user_uuid uuid)
returns text
language plpgsql
as $$
declare
  local_part text;
  base text;
begin
  local_part := split_part(coalesce(user_email, ''), '@', 1);
  base := public.normalize_slug_candidate(local_part);

  if base is null or base = '' or public.slug_is_blocked_db(base) or public.slug_requires_review_db(base) then
    base := 'profile';
  end if;

  return base || '-' || left(replace(user_uuid::text, '-', ''), 6);
end;
$$;

create or replace function public.generate_referral_code(name_seed text, user_uuid uuid)
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := upper(left(regexp_replace(coalesce(name_seed, ''), '[^A-Za-z0-9]+', '', 'g'), 6));

  if candidate is null or candidate = '' then
    candidate := 'TAPTAGG';
  end if;

  return candidate || upper(left(replace(user_uuid::text, '-', ''), 4));
end;
$$;

create or replace function public.generate_private_token_db(token_length integer default 7)
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
begin
  while i < token_length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    i := i + 1;
  end loop;

  return result;
end;
$$;

create or replace function public.ensure_profile_private_token()
returns trigger
language plpgsql
as $$
begin
  if new.private_token is null or trim(new.private_token) = '' then
    loop
      new.private_token := public.generate_private_token_db(7);
      exit when not exists (
        select 1 from public.profiles where private_token = new.private_token
      );
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_name text := coalesce(new.raw_user_meta_data->>'first_name', '');
  last_name text := coalesce(new.raw_user_meta_data->>'last_name', '');
  full_name text := trim(both ' ' from concat(first_name, ' ', last_name));
  base_slug_input text := coalesce(new.raw_user_meta_data->>'suggested_slug', full_name, new.email, '');
  normalized_requested_slug text := public.normalize_slug_candidate(base_slug_input);
  promo text := upper(coalesce(new.raw_user_meta_data->>'promo_code', ''));
  used_referral text := upper(coalesce(new.raw_user_meta_data->>'referral_code_used', ''));
  public_official boolean := coalesce((new.raw_user_meta_data->>'is_public_official')::boolean, false);
  is_founder boolean := promo = 'FOUNDERS';
  is_admin_promo boolean := promo = 'SP-ADMIN-9K7Q-2V4N-H8RA-X5TP';
  is_aff boolean := promo = 'AFFILIATE' or is_founder;
  generated_referral text;
  live_slug text;
  pending_slug text := null;
  pending_status text := 'approved';
  pending_reason text := null;
begin
  generated_referral := public.generate_referral_code(full_name, new.id);

  if public.slug_is_blocked_db(normalized_requested_slug) then
    live_slug := public.generate_safe_profile_slug(new.email, new.id);
    pending_reason := 'blocked_name_based_slug_fallback';
  elsif public.slug_requires_review_db(normalized_requested_slug) then
    live_slug := public.generate_safe_profile_slug(new.email, new.id);
    pending_slug := normalized_requested_slug;
    pending_status := 'pending_review';
    pending_reason := 'public_office_title';
  else
    live_slug := public.generate_profile_slug(normalized_requested_slug, new.id);
  end if;

  insert into public.profiles (
    user_id,
    full_name,
    slug,
    role_line,
    intro,
    email,
    phone,
    website_url,
    primary_link_1_title,
    primary_link_1_url,
    primary_link_1_type,
    primary_link_2_title,
    primary_link_2_url,
    primary_link_2_type,
    primary_link_3_title,
    primary_link_3_url,
    primary_link_3_type,
    primary_link_4_title,
    primary_link_4_url,
    primary_link_4_type,
    is_active,
    referral_code,
    referred_by,
    referral_code_used,
    is_affiliate,
    affiliate_tier,
    billing_exempt,
    lifetime_free,
    promo_code_used,
    is_public_official,
    is_admin,
    stripe_plan_key,
    slug_requested,
    slug_status,
    slug_review_reason
  )
  values (
    new.id,
    full_name,
    live_slug,
    '',
    '',
    coalesce(new.email, ''),
    '',
    '',
    'Call',
    '',
    'phone',
    'Email',
    '',
    'email',
    'Website',
    '',
    'website',
    'Website',
    '',
    'website',
    is_founder or is_admin_promo,
    generated_referral,
    nullif(used_referral, ''),
    nullif(used_referral, ''),
    is_aff,
    case
      when is_founder then 'founder'
      when is_aff then 'standard'
      else null
    end,
    is_founder or is_admin_promo,
    is_founder,
    nullif(promo, ''),
    public_official,
    is_admin_promo,
    case
      when is_founder then 'creator'
      when is_admin_promo then 'admin'
      else null
    end,
    pending_slug,
    pending_status,
    pending_reason
  )
  on conflict (user_id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    referral_code_used = coalesce(public.profiles.referral_code_used, excluded.referral_code_used),
    is_affiliate = public.profiles.is_affiliate or excluded.is_affiliate,
    affiliate_tier = coalesce(public.profiles.affiliate_tier, excluded.affiliate_tier),
    billing_exempt = public.profiles.billing_exempt or excluded.billing_exempt,
    lifetime_free = public.profiles.lifetime_free or excluded.lifetime_free,
    promo_code_used = coalesce(public.profiles.promo_code_used, excluded.promo_code_used),
    is_public_official = public.profiles.is_public_official or excluded.is_public_official,
    is_admin = public.profiles.is_admin or excluded.is_admin,
    stripe_plan_key = coalesce(public.profiles.stripe_plan_key, excluded.stripe_plan_key),
    slug_requested = coalesce(public.profiles.slug_requested, excluded.slug_requested),
    slug_status = case
      when public.profiles.slug_status = 'approved' and excluded.slug_status = 'pending_review'
        then excluded.slug_status
      else coalesce(public.profiles.slug_status, excluded.slug_status)
    end,
    slug_review_reason = coalesce(public.profiles.slug_review_reason, excluded.slug_review_reason),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.jsonb_value_changed(before_row jsonb, after_row jsonb, field_name text)
returns boolean
language sql
stable
as $$
  select coalesce(before_row -> field_name, 'null'::jsonb) is distinct from coalesce(after_row -> field_name, 'null'::jsonb);
$$;

create or replace function public.jsonb_has_non_default_value(row_data jsonb, field_name text)
returns boolean
language sql
stable
as $$
  select
    row_data ? field_name
    and coalesce(row_data -> field_name, 'null'::jsonb) not in ('null'::jsonb, 'false'::jsonb, '""'::jsonb);
$$;

create or replace function public.enforce_profile_slug_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  normal_owner_write boolean := jwt_role = 'authenticated' and auth.uid() = new.user_id;
  before_row jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  after_row jsonb := to_jsonb(new);
  protected_fields text[] := array[
    'is_admin',
    'is_active',
    'billing_exempt',
    'lifetime_free',
    'stripe_customer_id',
    'stripe_subscription_id',
    'stripe_plan_key',
    'subscription_status',
    'subscription_current_period_end',
    'current_period_end',
    'promo_code_used',
    'referral_code',
    'referred_by',
    'referral_code_used',
    'is_affiliate',
    'affiliate_tier',
    'referral_reconciled',
    'referral_reconciled_at',
    'referral_reconciled_by',
    'card_notification_sent_at'
  ];
  field_name text;
  normalized_live_slug text := public.normalize_slug_candidate(new.slug);
  normalized_requested_slug text := public.normalize_slug_candidate(new.slug_requested);
begin
  if not normal_owner_write then
    return new;
  end if;

  if tg_op = 'INSERT' then
    foreach field_name in array protected_fields loop
      if public.jsonb_has_non_default_value(after_row, field_name) then
        raise exception 'Authenticated users cannot set protected profile field: %', field_name;
      end if;
    end loop;
  else
    foreach field_name in array protected_fields loop
      if public.jsonb_value_changed(before_row, after_row, field_name) then
        raise exception 'Authenticated users cannot update protected profile field: %', field_name;
      end if;
    end loop;
  end if;

  if normalized_live_slug is null or normalized_live_slug = '' then
    raise exception 'Profile slug is required.';
  end if;

  if public.slug_is_blocked_db(normalized_live_slug) then
    raise exception 'That slug is blocked.';
  end if;

  new.slug := normalized_live_slug;

  if normalized_requested_slug is not null and normalized_requested_slug <> '' then
    if public.slug_is_blocked_db(normalized_requested_slug) then
      raise exception 'That requested slug is blocked.';
    end if;

    new.slug_requested := normalized_requested_slug;

    if public.slug_requires_review_db(normalized_requested_slug) and new.slug_status is distinct from 'pending_review' then
      raise exception 'Review-required slug requests must remain pending_review.';
    end if;
  else
    new.slug_requested := null;
  end if;

  if public.slug_requires_review_db(new.slug) then
    if tg_op = 'INSERT' then
      raise exception 'Review-required slugs cannot be published directly.';
    end if;

    if new.slug is distinct from old.slug then
      raise exception 'Review-required slugs must be approved by an admin before publication.';
    end if;

    if old.slug_status is distinct from 'approved' or new.slug_status is distinct from 'approved' then
      raise exception 'Review-required live slugs must keep approved status.';
    end if;
  end if;

  if new.slug_requested is not null and new.slug_requested = new.slug and new.slug_status is distinct from 'approved' then
    raise exception 'Pending requested slug cannot also be the live slug.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_profile_private_token_trigger on public.profiles;
create trigger ensure_profile_private_token_trigger
before insert or update on public.profiles
for each row execute function public.ensure_profile_private_token();

drop trigger if exists touch_profiles_updated_at_trigger on public.profiles;
create trigger touch_profiles_updated_at_trigger
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_profile_views_updated_at_trigger on public.profile_views;
create trigger touch_profile_views_updated_at_trigger
before update on public.profile_views
for each row execute function public.touch_updated_at();

drop trigger if exists touch_pass_tokens_updated_at_trigger on public.pass_tokens;
create trigger touch_pass_tokens_updated_at_trigger
before update on public.pass_tokens
for each row execute function public.touch_updated_at();

drop trigger if exists enforce_profile_slug_security_trigger on public.profiles;
create trigger enforce_profile_slug_security_trigger
before insert or update on public.profiles
for each row execute function public.enforce_profile_slug_security();

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
when (coalesce((new.raw_user_meta_data->>'business_only')::boolean, false) = false)
execute function public.handle_new_user_profile();

insert into public.profiles (
  user_id,
  full_name,
  slug,
  role_line,
  intro,
  email,
  phone,
  website_url,
  primary_link_1_title,
  primary_link_1_url,
  primary_link_1_type,
  primary_link_2_title,
  primary_link_2_url,
  primary_link_2_type,
  primary_link_3_title,
  primary_link_3_url,
  primary_link_3_type,
  primary_link_4_title,
  primary_link_4_url,
  primary_link_4_type,
  is_active,
  referral_code,
  referred_by,
  referral_code_used,
  is_affiliate,
  affiliate_tier,
  billing_exempt,
  lifetime_free,
  promo_code_used,
  is_public_official,
  is_admin,
  stripe_plan_key,
  slug_requested,
  slug_status,
  slug_review_reason
)
select
  u.id,
  trim(both ' ' from concat(
    coalesce(u.raw_user_meta_data->>'first_name', ''),
    ' ',
    coalesce(u.raw_user_meta_data->>'last_name', '')
  )),
  case
    when public.slug_is_blocked_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then public.generate_safe_profile_slug(u.email, u.id)
    when public.slug_requires_review_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then public.generate_safe_profile_slug(u.email, u.id)
    else public.generate_profile_slug(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    )), u.id)
  end,
  '',
  '',
  coalesce(u.email, ''),
  '',
  '',
  'Call',
  '',
  'phone',
  'Email',
  '',
  'email',
  'Website',
  '',
  'website',
  'Website',
  '',
  'website',
  upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) in ('FOUNDERS', 'SP-ADMIN-9K7Q-2V4N-H8RA-X5TP'),
  public.generate_referral_code(
    trim(both ' ' from concat(
      coalesce(u.raw_user_meta_data->>'first_name', ''),
      ' ',
      coalesce(u.raw_user_meta_data->>'last_name', '')
    )),
    u.id
  ),
  nullif(upper(coalesce(u.raw_user_meta_data->>'referral_code_used', '')), ''),
  nullif(upper(coalesce(u.raw_user_meta_data->>'referral_code_used', '')), ''),
  upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) in ('AFFILIATE', 'FOUNDERS'),
  case
    when upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'FOUNDERS' then 'founder'
    when upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'AFFILIATE' then 'standard'
    else null
  end,
  upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) in ('FOUNDERS', 'SP-ADMIN-9K7Q-2V4N-H8RA-X5TP'),
  upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'FOUNDERS',
  nullif(upper(coalesce(u.raw_user_meta_data->>'promo_code', '')), ''),
  coalesce((u.raw_user_meta_data->>'is_public_official')::boolean, false),
  upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'SP-ADMIN-9K7Q-2V4N-H8RA-X5TP',
  case
    when upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'FOUNDERS' then 'creator'
    when upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'SP-ADMIN-9K7Q-2V4N-H8RA-X5TP' then 'admin'
    else null
  end,
  case
    when public.slug_requires_review_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))
    else null
  end,
  case
    when public.slug_requires_review_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then 'pending_review'
    else 'approved'
  end,
  case
    when public.slug_is_blocked_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then 'blocked_name_based_slug_fallback'
    when public.slug_requires_review_db(public.normalize_slug_candidate(coalesce(
      u.raw_user_meta_data->>'suggested_slug',
      trim(both ' ' from concat(
        coalesce(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(u.raw_user_meta_data->>'last_name', '')
      )),
      u.email,
      ''
    ))) then 'public_office_title'
    else null
  end
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
)
on conflict do nothing;

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
  select case coalesce(theme_key, 'taptagg_brand')
    when 'taptagg_brand' then true
    when 'executive_navy' then true
    when 'modern_slate' then plan_key in ('core', 'tagg_plus', 'creator', 'business')
    when 'clean_horizon' then plan_key in ('core', 'tagg_plus', 'creator', 'business')
    when 'executive_gold' then plan_key in ('tagg_plus', 'creator', 'business')
    when 'sage_professional' then plan_key in ('tagg_plus', 'creator', 'business')
    when 'custom' then plan_key in ('creator', 'business', 'business_individual')
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
    new.brand_color_background := null;
    new.brand_color_text := null;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_theme_entitlement on public.profiles;
create trigger enforce_profile_theme_entitlement
before insert or update of theme_key, brand_color_primary, brand_color_secondary, brand_color_accent, brand_color_background, brand_color_text, stripe_plan_key, is_active, billing_exempt, lifetime_free, promo_code_used, is_admin
on public.profiles
for each row
execute function public.enforce_profile_theme_entitlement();

alter table public.profiles enable row level security;
alter table public.profile_views enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.organizations enable row level security;
alter table public.business_regions enable row level security;
alter table public.business_locations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pass_tokens enable row level security;

drop policy if exists "Users can view their own profile record" on public.profiles;
create policy "Users can view their own profile record"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile record" on public.profiles;
create policy "Users can insert their own profile record"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile record" on public.profiles;
create policy "Users can update their own profile record"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Profiles are publicly readable by slug" on public.profiles;
create policy "Profiles are publicly readable by slug"
on public.profiles for select
using (
  is_active = true
  and consent_public_visibility = true
  and slug_status = 'approved'
  and not public.slug_is_blocked_db(slug)
);

drop policy if exists "Users can view their own profile views" on public.profile_views;
create policy "Users can view their own profile views"
on public.profile_views for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert their own profile views" on public.profile_views;
create policy "Users can insert their own profile views"
on public.profile_views for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own profile views" on public.profile_views;
create policy "Users can update their own profile views"
on public.profile_views for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own profile views" on public.profile_views;
create policy "Users can delete their own profile views"
on public.profile_views for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Public can view published profile views" on public.profile_views;
create policy "Public can view published profile views"
on public.profile_views for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.is_active = true
      and p.consent_public_visibility = true
      and p.slug_status = 'approved'
      and not public.slug_is_blocked_db(p.slug)
  )
);

drop policy if exists "Organization owners can view their organizations" on public.organizations;
create policy "Organization owners can view their organizations"
on public.organizations for select
using (auth.uid() = owner_user_id);

drop policy if exists "Organization owners can view members" on public.organization_members;
create policy "Organization owners can view members"
on public.organization_members for select
using (
  exists (
    select 1 from public.organizations o
    where o.id = organization_members.organization_id
      and o.owner_user_id = auth.uid()
  )
);

drop policy if exists "Business admins can view regions" on public.business_regions;
create policy "Business admins can view regions"
on public.business_regions for select
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can manage regions" on public.business_regions;
create policy "Business admins can manage regions"
on public.business_regions for insert
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can update regions" on public.business_regions;
create policy "Business admins can update regions"
on public.business_regions for update
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
)
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can delete regions" on public.business_regions;
create policy "Business admins can delete regions"
on public.business_regions for delete
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can view locations" on public.business_locations;
create policy "Business admins can view locations"
on public.business_locations for select
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
);

drop policy if exists "Business admins can manage locations" on public.business_locations;
create policy "Business admins can manage locations"
on public.business_locations for insert
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can update locations" on public.business_locations;
create policy "Business admins can update locations"
on public.business_locations for update
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
)
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
);

drop policy if exists "Business admins can delete locations" on public.business_locations;
create policy "Business admins can delete locations"
on public.business_locations for delete
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Organization owners can view pass tokens" on public.pass_tokens;
create policy "Organization owners can view pass tokens"
on public.pass_tokens for select
using (
  exists (
    select 1 from public.organizations o
    where o.id = pass_tokens.organization_id
      and o.owner_user_id = auth.uid()
  )
);

comment on table public.profiles
is 'TapTagg user profiles, billing state, slug moderation state, and card fulfillment metadata.';

comment on table public.profile_views
is 'Optional per-profile public views used for multi-view profile pages.';

comment on table public.admin_audit_log
is 'Best-effort admin action audit trail written by service-role routes.';

comment on table public.pass_tokens
is 'Permanent TapTagg card/pass token URLs that can be assigned, unassigned, deactivated, or reassigned without changing the public URL.';

comment on table public.business_regions
is 'Future-facing region groupings for parent businesses, such as state-based or custom territories.';

comment on table public.business_locations
is 'Business offices, rooftops, or locations under a parent TapTagg business organization.';

comment on column public.organization_members.location_id
is 'Optional business location assignment for an employee or member. Null means the member belongs to the business globally.';

comment on column public.profiles.consent_public_visibility
is 'When true, the approved profile slug can resolve publicly. When false, the personalized slug is hidden for privacy.';

comment on column public.profile_views.show_text
is 'Secondary hero action mode: true=text, false=email, null=none.';

-- ============================================================
-- Source: supabase/phase73_contact_sharing.sql
-- ============================================================

-- Contact Sharing.
--
-- Visitors can privately share contact details with an individual profile owner
-- or a business/team profile. Inserts are handled by the server route.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  organization_id uuid,
  profile_view_id uuid,
  submitted_to_user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  title text,
  note text,
  source text,
  consent_to_contact boolean not null default false,
  consent_text text,
  consent_given_at timestamptz,
  source_profile_slug text,
  source_url text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contact_submissions_profile_id_idx
on public.contact_submissions (profile_id, created_at desc);

create index if not exists contact_submissions_organization_id_idx
on public.contact_submissions (organization_id, created_at desc);

create index if not exists contact_submissions_submitted_to_user_id_idx
on public.contact_submissions (submitted_to_user_id, created_at desc);

alter table public.contact_submissions enable row level security;

drop policy if exists "Profile owners can read profile contacts" on public.contact_submissions;
create policy "Profile owners can read profile contacts"
on public.contact_submissions for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = contact_submissions.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Organization admins can read organization contacts" on public.contact_submissions;
create policy "Organization admins can read organization contacts"
on public.contact_submissions for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = contact_submissions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Team members can read own contacts" on public.contact_submissions;
create policy "Team members can read own contacts"
on public.contact_submissions for select
using (
  submitted_to_user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members m
    where m.id = contact_submissions.profile_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

comment on table public.contact_submissions
is 'Private contact details shared by visitors from public TapTagg profile pages.';

-- ============================================================
-- Source: supabase/phase76_contact_submission_consent.sql
-- ============================================================

-- Contact Sharing consent audit fields.
--
-- Visitors must explicitly consent to being contacted about their inquiry.
-- This is not a marketing opt-in.

alter table public.contact_submissions
add column if not exists consent_to_contact boolean not null default false,
add column if not exists consent_text text,
add column if not exists consent_given_at timestamptz,
add column if not exists source_profile_slug text,
add column if not exists source_url text,
add column if not exists ip_address text;

create index if not exists contact_submissions_consent_given_at_idx
on public.contact_submissions (consent_given_at desc);

comment on column public.contact_submissions.consent_to_contact
is 'True when the submitter explicitly agreed to be contacted about this inquiry.';

comment on column public.contact_submissions.consent_text
is 'Exact consent language shown to the submitter at the time of submission.';

comment on column public.contact_submissions.consent_given_at
is 'Timestamp when inquiry-response contact consent was granted.';

comment on column public.contact_submissions.source_url
is 'Public page URL or referrer where the consented contact submission originated.';

comment on column public.contact_submissions.ip_address
is 'Request IP available from platform headers at time of submission, used for consent audit context.';

-- ============================================================
-- Source: supabase/phase74_analytics_events.sql
-- ============================================================

-- TapTagg Analytics.
--
-- Centralized anonymous event collection for profile exposure, engagement,
-- contact sharing, and business/team operations.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  organization_member_id uuid references public.organization_members(id) on delete set null,
  profile_view_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  card_id uuid,
  source text,
  action_type text,
  action_label text,
  action_url text,
  visitor_id text,
  session_id text,
  user_agent text,
  referrer text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint analytics_events_event_type_check check (
    event_type in (
      'profile_view',
      'qr_scan',
      'nfc_tap',
      'direct_visit',
      'shared_link_visit',
      'button_click',
      'vcard_download',
      'contact_save',
      'contact_shared',
      'card_assigned',
      'card_reassigned',
      'employee_activated',
      'employee_deactivated'
    )
  )
);

create index if not exists analytics_events_created_at_idx
on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_type_idx
on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_profile_id_idx
on public.analytics_events (profile_id, created_at desc);

create index if not exists analytics_events_organization_id_idx
on public.analytics_events (organization_id, created_at desc);

create index if not exists analytics_events_organization_member_id_idx
on public.analytics_events (organization_member_id, created_at desc);

create index if not exists analytics_events_visitor_id_idx
on public.analytics_events (visitor_id, created_at desc);

create index if not exists analytics_events_source_idx
on public.analytics_events (source, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Profile owners can read own analytics" on public.analytics_events;
create policy "Profile owners can read own analytics"
on public.analytics_events for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = analytics_events.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Organization admins can read organization analytics" on public.analytics_events;
create policy "Organization admins can read organization analytics"
on public.analytics_events for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = analytics_events.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Team members can read own analytics" on public.analytics_events;
create policy "Team members can read own analytics"
on public.analytics_events for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members m
    where m.id = analytics_events.organization_member_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

comment on table public.analytics_events
is 'Anonymous profile, engagement, contact sharing, and team operation events for TapTagg analytics.';

-- ============================================================
-- Source: supabase/phase75_gamification.sql
-- ============================================================

-- TapTagg gamification foundation.
--
-- Adds badge definitions, earned badges, team challenges, competitions,
-- sales attribution, and normalized event support for scoring.

alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;

alter table public.analytics_events
  add constraint analytics_events_event_type_check check (
    event_type in (
      'profile_view',
      'qr_scan',
      'nfc_tap',
      'direct_visit',
      'shared_link_visit',
      'button_click',
      'email_click',
      'phone_click',
      'website_click',
      'social_click',
      'appointment_click',
      'manual_follow_up_logged',
      'sale_logged',
      'revenue_logged',
      'vcard_download',
      'contact_save',
      'contact_shared',
      'contact_submission',
      'card_assigned',
      'card_reassigned',
      'employee_activated',
      'employee_deactivated'
    )
  );

create table if not exists public.gamification_badge_definitions (
  id uuid primary key default gen_random_uuid(),
  badge_key text unique not null,
  name text not null,
  description text not null,
  category text not null,
  icon text,
  point_bonus integer default 0,
  threshold_value integer,
  metric_key text,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists gamification_badge_definitions_metric_key_idx
on public.gamification_badge_definitions (metric_key);

create index if not exists gamification_badge_definitions_badge_key_idx
on public.gamification_badge_definitions (badge_key);

create table if not exists public.gamification_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz default timezone('utc', now()),
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb default '{}'::jsonb,
  unique(user_id, badge_key, period_start, period_end)
);

create index if not exists gamification_user_badges_user_id_idx
on public.gamification_user_badges (user_id, earned_at desc);

create index if not exists gamification_user_badges_badge_key_idx
on public.gamification_user_badges (badge_key);

create table if not exists public.gamification_team_challenges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  metric_key text not null,
  goal_value integer not null,
  start_date date not null,
  end_date date not null,
  prize text,
  status text default 'active',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint gamification_team_challenges_status_check check (status in ('active', 'completed', 'expired', 'paused'))
);

create index if not exists gamification_team_challenges_organization_id_idx
on public.gamification_team_challenges (organization_id, created_at desc);

create index if not exists gamification_team_challenges_metric_key_idx
on public.gamification_team_challenges (metric_key);

create table if not exists public.gamification_challenge_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.gamification_team_challenges(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  progress_value integer not null default 0,
  goal_value integer not null,
  snapshot_date date default current_date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists gamification_challenge_progress_snapshots_challenge_id_idx
on public.gamification_challenge_progress_snapshots (challenge_id, snapshot_date desc);

create unique index if not exists gamification_challenge_progress_snapshots_unique_day_idx
on public.gamification_challenge_progress_snapshots (challenge_id, snapshot_date);

create index if not exists gamification_challenge_progress_snapshots_organization_id_idx
on public.gamification_challenge_progress_snapshots (organization_id, snapshot_date desc);

create table if not exists public.gamification_competitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  metric_key text not null,
  start_date date not null,
  end_date date not null,
  prize text,
  status text default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc', now()),
  constraint gamification_competitions_status_check check (status in ('active', 'completed', 'expired', 'paused'))
);

create index if not exists gamification_competitions_organization_id_idx
on public.gamification_competitions (organization_id, created_at desc);

create index if not exists gamification_competitions_metric_key_idx
on public.gamification_competitions (metric_key);

create table if not exists public.gamification_competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.gamification_competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rank integer not null,
  score_value integer not null,
  calculated_at timestamptz default timezone('utc', now()),
  metadata jsonb default '{}'::jsonb
);

create index if not exists gamification_competition_results_competition_id_idx
on public.gamification_competition_results (competition_id, rank asc);

create index if not exists gamification_competition_results_user_id_idx
on public.gamification_competition_results (user_id, calculated_at desc);

create unique index if not exists gamification_competition_results_unique_user_idx
on public.gamification_competition_results (competition_id, user_id);

create table if not exists public.sales_attribution_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  contact_submission_id uuid references public.contact_submissions(id) on delete set null,
  attribution_type text not null,
  revenue_amount numeric(12,2),
  deal_name text,
  customer_name text,
  notes text,
  source text default 'manual',
  occurred_at timestamptz default timezone('utc', now()),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint sales_attribution_events_attribution_type_check check (
    attribution_type in (
      'appointment_booked',
      'follow_up_logged',
      'opportunity_created',
      'sale_logged',
      'revenue_logged'
    )
  )
);

create index if not exists sales_attribution_events_owner_user_id_idx
on public.sales_attribution_events (owner_user_id, created_at desc);

create index if not exists sales_attribution_events_organization_id_idx
on public.sales_attribution_events (organization_id, created_at desc);

create index if not exists sales_attribution_events_created_at_idx
on public.sales_attribution_events (created_at desc);

create index if not exists sales_attribution_events_occurred_at_idx
on public.sales_attribution_events (occurred_at desc);

alter table public.gamification_badge_definitions enable row level security;
alter table public.gamification_user_badges enable row level security;
alter table public.gamification_team_challenges enable row level security;
alter table public.gamification_challenge_progress_snapshots enable row level security;
alter table public.gamification_competitions enable row level security;
alter table public.gamification_competition_results enable row level security;
alter table public.sales_attribution_events enable row level security;

drop policy if exists "Authenticated users can read active badge definitions" on public.gamification_badge_definitions;
create policy "Authenticated users can read active badge definitions"
on public.gamification_badge_definitions for select
using (auth.role() = 'authenticated');

drop policy if exists "Users can read their own badges" on public.gamification_user_badges;
create policy "Users can read their own badges"
on public.gamification_user_badges for select
using (user_id = auth.uid());

drop policy if exists "Users can read org badges through metadata" on public.gamification_user_badges;
create policy "Users can read org badges through metadata"
on public.gamification_user_badges for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
      and coalesce(metadata->>'organization_id', '') = m.organization_id::text
  )
);

drop policy if exists "Organization admins can read challenges" on public.gamification_team_challenges;
create policy "Organization admins can read challenges"
on public.gamification_team_challenges for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_team_challenges.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
  or (
    status = 'active'
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = gamification_team_challenges.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists "Organization admins can manage challenges" on public.gamification_team_challenges;
create policy "Organization admins can manage challenges"
on public.gamification_team_challenges for insert
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_team_challenges.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can update challenges" on public.gamification_team_challenges;
create policy "Organization admins can update challenges"
on public.gamification_team_challenges for update
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_team_challenges.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_team_challenges.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can delete challenges" on public.gamification_team_challenges;
create policy "Organization admins can delete challenges"
on public.gamification_team_challenges for delete
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_team_challenges.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can read challenge snapshots" on public.gamification_challenge_progress_snapshots;
create policy "Organization admins can read challenge snapshots"
on public.gamification_challenge_progress_snapshots for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_challenge_progress_snapshots.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.organization_members m
    join public.gamification_team_challenges c on c.id = gamification_challenge_progress_snapshots.challenge_id
    where c.organization_id = m.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and c.status = 'active'
  )
);

drop policy if exists "Organization admins can manage challenge snapshots" on public.gamification_challenge_progress_snapshots;
create policy "Organization admins can manage challenge snapshots"
on public.gamification_challenge_progress_snapshots for insert
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_challenge_progress_snapshots.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can read competitions" on public.gamification_competitions;
create policy "Organization admins can read competitions"
on public.gamification_competitions for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_competitions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
  or (
    status = 'active'
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = gamification_competitions.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists "Organization admins can manage competitions" on public.gamification_competitions;
create policy "Organization admins can manage competitions"
on public.gamification_competitions for insert
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_competitions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can update competitions" on public.gamification_competitions;
create policy "Organization admins can update competitions"
on public.gamification_competitions for update
using (
  status not in ('completed', 'expired')
  and
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_competitions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
)
with check (
  status not in ('completed', 'expired')
  and
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_competitions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can delete competitions" on public.gamification_competitions;
create policy "Organization admins can delete competitions"
on public.gamification_competitions for delete
using (
  status not in ('completed', 'expired')
  and
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = gamification_competitions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Users can read their own competition results" on public.gamification_competition_results;
create policy "Users can read their own competition results"
on public.gamification_competition_results for select
using (user_id = auth.uid());

drop policy if exists "Organization admins can read competition results" on public.gamification_competition_results;
create policy "Organization admins can read competition results"
on public.gamification_competition_results for select
using (
  exists (
    select 1
    from public.gamification_competitions c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = gamification_competition_results.competition_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Users can read own attribution events" on public.sales_attribution_events;
create policy "Users can read own attribution events"
on public.sales_attribution_events for select
using (owner_user_id = auth.uid());

drop policy if exists "Organization admins can read attribution events" on public.sales_attribution_events;
create policy "Organization admins can read attribution events"
on public.sales_attribution_events for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = sales_attribution_events.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Users can create own attribution events" on public.sales_attribution_events;
create policy "Users can create own attribution events"
on public.sales_attribution_events for insert
with check (
  owner_user_id = auth.uid()
  and (
    organization_id is null
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = sales_attribution_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists "Users can update own attribution events" on public.sales_attribution_events;
create policy "Users can update own attribution events"
on public.sales_attribution_events for update
using (
  owner_user_id = auth.uid()
  and (
    organization_id is null
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = sales_attribution_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
)
with check (
  owner_user_id = auth.uid()
  and (
    organization_id is null
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = sales_attribution_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists "Users can delete own attribution events" on public.sales_attribution_events;
create policy "Users can delete own attribution events"
on public.sales_attribution_events for delete
using (owner_user_id = auth.uid());

comment on table public.gamification_badge_definitions
is 'Global badge catalog for TapTagg gamification.';

comment on table public.gamification_user_badges
is 'Earned badge records for individual TapTagg users.';

comment on table public.gamification_team_challenges
is 'Organization-scoped team challenges and goals.';

comment on table public.gamification_challenge_progress_snapshots
is 'Daily or ad hoc challenge progress snapshots.';

comment on table public.gamification_competitions
is 'Organization-scoped manager competitions and standings windows.';

comment on table public.gamification_competition_results
is 'Stored competition result snapshots and rankings.';

comment on table public.sales_attribution_events
is 'Manual attribution and revenue logging for TapTagg users and organizations.';

-- ============================================================
-- Source: supabase/phase80_business_asset_uploads.sql
-- ============================================================

-- Business asset uploads.
--
-- Business logos and employee headshots are stored in Supabase Storage while
-- profile records keep only the public URL.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-assets',
  'business-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.organization_members
  add column if not exists headshot_url text;

comment on column public.organization_members.headshot_url
is 'Optional employee headshot URL stored in the business-assets storage bucket.';

-- ============================================================
-- Source: supabase/phase81_business_webhooks.sql
-- ============================================================

-- Business webhooks.
--
-- Stores outbound webhook settings and delivery attempts for TapTagg Business.

create table if not exists public.organization_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  enabled boolean not null default false,
  webhook_url text,
  webhook_secret text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  status_code integer,
  success boolean not null default false,
  attempted_at timestamptz not null default timezone('utc', now()),
  response_body text,
  error_message text
);

create index if not exists organization_webhooks_organization_id_idx
on public.organization_webhooks (organization_id);

create index if not exists webhook_deliveries_organization_id_attempted_at_idx
on public.webhook_deliveries (organization_id, attempted_at desc);

create index if not exists webhook_deliveries_attempted_at_idx
on public.webhook_deliveries (attempted_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_organization_webhooks_updated_at_trigger on public.organization_webhooks;
create trigger touch_organization_webhooks_updated_at_trigger
before update on public.organization_webhooks
for each row execute function public.touch_updated_at();

alter table public.organization_webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

drop policy if exists "Organization admins can view webhooks" on public.organization_webhooks;
create policy "Organization admins can view webhooks"
on public.organization_webhooks for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = organization_webhooks.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can view webhook deliveries" on public.webhook_deliveries;
create policy "Organization admins can view webhook deliveries"
on public.webhook_deliveries for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = webhook_deliveries.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

comment on table public.organization_webhooks
is 'Outbound webhook settings for TapTagg Business organizations.';

comment on table public.webhook_deliveries
is 'Outbound webhook delivery attempts emitted by TapTagg Business.';

-- ============================================================
-- Source: supabase/phase87_multilocation_business.sql
-- ============================================================

-- Multi-location business foundation.
--
-- Adds parent-business locations, future regions, location assignment on
-- business employees, and analytics fields that can later be filtered by
-- business, location, or region without changing existing business flows.

create table if not exists public.business_regions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  state_codes text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text,
  address text,
  city text,
  state text,
  phone text,
  region_id uuid references public.business_regions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.organization_members
  add column if not exists location_id uuid references public.business_locations(id) on delete set null;

alter table public.analytics_events
  add column if not exists location_id uuid references public.business_locations(id) on delete set null,
  add column if not exists region_id uuid references public.business_regions(id) on delete set null;

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'member', 'super_admin', 'business_admin', 'location_admin', 'employee'));

create unique index if not exists business_regions_business_id_name_idx
on public.business_regions (business_id, name);

create index if not exists business_regions_business_id_idx
on public.business_regions (business_id, created_at desc);

create index if not exists business_locations_business_id_idx
on public.business_locations (business_id, created_at desc);

create unique index if not exists business_locations_business_id_slug_idx
on public.business_locations (business_id, slug)
where slug is not null;

create index if not exists business_locations_region_id_idx
on public.business_locations (region_id, created_at desc);

create index if not exists organization_members_location_id_idx
on public.organization_members (location_id, created_at desc);

create index if not exists analytics_events_location_id_idx
on public.analytics_events (location_id, created_at desc);

create index if not exists analytics_events_region_id_idx
on public.analytics_events (region_id, created_at desc);

alter table public.business_regions enable row level security;
alter table public.business_locations enable row level security;

drop policy if exists "Business admins can view regions" on public.business_regions;
create policy "Business admins can view regions"
on public.business_regions for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can manage regions" on public.business_regions;
create policy "Business admins can manage regions"
on public.business_regions for insert
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can update regions" on public.business_regions;
create policy "Business admins can update regions"
on public.business_regions for update
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can delete regions" on public.business_regions;
create policy "Business admins can delete regions"
on public.business_regions for delete
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_regions.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can view locations" on public.business_locations;
create policy "Business admins can view locations"
on public.business_locations for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
);

drop policy if exists "Business admins can manage locations" on public.business_locations;
create policy "Business admins can manage locations"
on public.business_locations for insert
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

drop policy if exists "Business admins can update locations" on public.business_locations;
create policy "Business admins can update locations"
on public.business_locations for update
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
)
with check (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'location_admin'
      and m.location_id = business_locations.id
  )
);

drop policy if exists "Business admins can delete locations" on public.business_locations;
create policy "Business admins can delete locations"
on public.business_locations for delete
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = business_locations.business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'super_admin', 'business_admin')
  )
);

comment on table public.business_regions
is 'Future-facing region groupings for parent businesses, such as state-based or custom territories.';

comment on table public.business_locations
is 'Business offices, rooftops, or locations under a parent TapTagg business organization.';

comment on column public.organization_members.location_id
is 'Optional business location assignment for an employee or member. Null means the member belongs to the business globally.';

comment on column public.analytics_events.location_id
is 'Optional location context for business analytics filtering.';

comment on column public.analytics_events.region_id
is 'Optional region context for business analytics filtering.';

-- ============================================================
-- Source: supabase/phase95_profile_secondary_button.sql
-- ============================================================

-- Main profile secondary hero button support.
--
-- The main profile now uses the same tri-state secondary action model as
-- profile views:
-- true  = show Text as the secondary action
-- false = show Email as the secondary action
-- null  = show no secondary action

alter table public.profiles
  add column if not exists show_text boolean default true;

comment on column public.profiles.show_text
is 'Secondary hero action mode for the main profile: true=text, false=email, null=none.';

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


-- ============================================================
-- Fresh-project overrides
-- ============================================================

alter table public.profiles
  alter column consent_public_visibility set default false;

alter table public.profile_views
  alter column show_text set default false,
  alter column show_text set not null;

comment on column public.profiles.consent_public_visibility
is 'When true, the approved profile slug can resolve publicly. When false, the personalized slug is hidden for privacy.';

comment on column public.profile_views.show_text
is 'Secondary hero action mode: true=text, false=email, null=none.';
