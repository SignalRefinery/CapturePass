-- Signup slug moderation fix
-- Goal:
-- - clean slugs -> auto approved
-- - title/government slugs -> pending review queue
-- - blocked/profane/system slugs -> safe fallback live slug
-- - accounts still get created cleanly

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

create or replace function public.slug_is_blocked_db(input text)
returns boolean
language plpgsql
as $$
declare
  slug text := public.normalize_slug_candidate(input);
  abuse_normalized text := lower(regexp_replace(coalesce(input, ''), '[^a-z0-9]', '', 'g'));
begin
  if slug is null or slug = '' then
    return true;
  end if;

  if length(slug) < 3 or length(slug) > 40 then
    return true;
  end if;

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
  ) then
    return true;
  end if;

  if slug like 'admin%' or slug like 'api%' or slug like 'billing%' or slug like 'official%'
     or slug like 'security%' or slug like 'staff%' or slug like 'support%'
     or slug like 'taptagg%' then
    return true;
  end if;

  if abuse_normalized in (
    'asshole','bastard','bitch','bollocks','bullshit','chink','cock','coon','cunt','damn',
    'dick','douche','dyke','fag','faggot','fuck','fucker','fucking','gook','hitler','kike',
    'motherfucker','nazi','nigger','penis','perv','piss','prick','pussy','retard','shit',
    'shitty','slut','spic','tranny','twat','whore'
  ) then
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
  normalized text := lower(regexp_replace(coalesce(input, ''), '[^a-z0-9]', '', 'g'));
begin
  if normalized = '' then
    return false;
  end if;

  if normalized like 'alderman%' or normalized like 'attorneygeneral%' or normalized like 'chief%'
     or normalized like 'clerk%' or normalized like 'commissioner%' or normalized like 'comptroller%'
     or normalized like 'councilman%' or normalized like 'councilmember%' or normalized like 'deputy%'
     or normalized like 'director%' or normalized like 'governor%' or normalized like 'judge%'
     or normalized like 'justice%' or normalized like 'lieutenantgovernor%' or normalized like 'ltgovernor%'
     or normalized like 'marshal%' or normalized like 'mayor%' or normalized like 'officer%'
     or normalized like 'policechief%' or normalized like 'president%' or normalized like 'prosecutor%'
     or normalized like 'rep%' or normalized like 'representative%' or normalized like 'senator%'
     or normalized like 'secretary%' or normalized like 'sheriff%' or normalized like 'speaker%'
     or normalized like 'statesattorney%' or normalized like 'superintendent%' or normalized like 'treasurer%'
     or normalized like 'trustee%' or normalized like 'trooper%' then
    return true;
  end if;

  return false;
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

alter table public.profiles
add column if not exists is_admin boolean not null default false;

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
  is_aff boolean := promo = 'AFFILIATE' OR is_founder;
  generated_referral text;
  live_slug text;
  pending_slug text := null;
  pending_status text := 'approved';
  pending_reason text := null;
begin
  generated_referral := public.generate_referral_code(full_name, new.id);

  if public.slug_is_blocked_db(normalized_requested_slug) then
    live_slug := public.generate_safe_profile_slug(new.email, new.id);
    pending_slug := null;
    pending_status := 'approved';
    pending_reason := 'blocked_name_based_slug_fallback';
  elsif public.slug_requires_review_db(normalized_requested_slug) then
    live_slug := public.generate_safe_profile_slug(new.email, new.id);
    pending_slug := normalized_requested_slug;
    pending_status := 'pending_review';
    pending_reason := 'public_office_title';
  else
    live_slug := public.generate_profile_slug(normalized_requested_slug, new.id);
    pending_slug := null;
    pending_status := 'approved';
    pending_reason := null;
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
    updated_at = now();

  return new;
exception
  when others then
    raise exception 'handle_new_user_profile failed: %', sqlerrm;
end;
$$;

comment on function public.handle_new_user_profile()
is 'Creates profiles from signup while routing restricted title-based slugs into pending review and auto-approving clean slugs.';
