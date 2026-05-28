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
  page_mode text not null default 'single',
  multi_view_display_mode text not null default 'favorite',
  default_view_id uuid,
  full_name text not null default '',
  organization_name text not null default '',
  role_line text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  website_url text not null default '',
  profile_badge_1 text not null default '',
  profile_badge_2 text not null default '',
  profile_badge_3 text not null default '',
  primary_link_1_title text not null default 'Call',
  primary_link_1_url text not null default '',
  primary_link_2_title text not null default 'Email',
  primary_link_2_url text not null default '',
  primary_link_3_title text not null default 'Website',
  primary_link_3_url text not null default '',
  primary_link_4_title text not null default 'Website',
  primary_link_4_url text not null default '',
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
  card_notification_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_page_mode_check check (page_mode in ('single', 'multi')),
  constraint profiles_multi_view_display_mode_check check (multi_view_display_mode in ('landing', 'favorite')),
  constraint profiles_slug_status_check check (slug_status in ('approved', 'pending_review', 'rejected'))
);

create unique index if not exists profiles_user_id_idx on public.profiles (user_id);
create unique index if not exists profiles_slug_idx on public.profiles (slug);
create unique index if not exists profiles_referral_code_idx on public.profiles (referral_code);
create unique index if not exists profiles_slug_requested_unique_idx
on public.profiles (slug_requested)
where slug_requested is not null;
create index if not exists profiles_slug_status_idx on public.profiles (slug_status);

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
  primary_link_2_title text not null default '',
  primary_link_2_url text not null default '',
  primary_link_3_title text not null default '',
  primary_link_3_url text not null default '',
  primary_link_4_title text not null default '',
  primary_link_4_url text not null default '',
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
    primary_link_2_title,
    primary_link_2_url,
    primary_link_3_title,
    primary_link_3_url,
    primary_link_4_title,
    primary_link_4_url,
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
    'Email',
    '',
    'Website',
    '',
    'Website',
    '',
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
      when is_founder then 'professional'
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

drop trigger if exists enforce_profile_slug_security_trigger on public.profiles;
create trigger enforce_profile_slug_security_trigger
before insert or update on public.profiles
for each row execute function public.enforce_profile_slug_security();

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

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
  primary_link_2_title,
  primary_link_2_url,
  primary_link_3_title,
  primary_link_3_url,
  primary_link_4_title,
  primary_link_4_url,
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
  'Email',
  '',
  'Website',
  '',
  'Website',
  '',
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
    when upper(coalesce(u.raw_user_meta_data->>'promo_code', '')) = 'FOUNDERS' then 'professional'
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

alter table public.profiles enable row level security;
alter table public.profile_views enable row level security;
alter table public.admin_audit_log enable row level security;

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

comment on table public.profiles
is 'TapTagg user profiles, billing state, slug moderation state, and card fulfillment metadata.';

comment on table public.profile_views
is 'Optional per-profile public views used for multi-view profile pages.';

comment on table public.admin_audit_log
is 'Best-effort admin action audit trail written by service-role routes.';

comment on column public.profiles.consent_public_visibility
is 'When true, the approved profile slug can resolve publicly. When false, the personalized slug is hidden for privacy.';

comment on column public.profile_views.show_text
is 'Secondary hero action mode: true=text, false=email, null=none.';
