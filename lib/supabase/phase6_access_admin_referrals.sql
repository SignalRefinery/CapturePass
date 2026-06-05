alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by text,
  add column if not exists is_affiliate boolean not null default false,
  add column if not exists affiliate_tier text,
  add column if not exists billing_exempt boolean not null default false,
  add column if not exists lifetime_free boolean not null default false,
  add column if not exists promo_code_used text,
  add column if not exists is_public_official boolean not null default false;

create unique index if not exists profiles_referral_code_idx on public.profiles (referral_code);
create unique index if not exists profiles_user_id_idx on public.profiles (user_id);
create unique index if not exists profiles_slug_idx on public.profiles (slug);

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

  candidate := candidate || upper(left(replace(user_uuid::text, '-', ''), 4));

  return candidate;
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
  base_slug text := coalesce(new.raw_user_meta_data->>'suggested_slug', full_name, new.email, '');
  promo text := upper(coalesce(new.raw_user_meta_data->>'promo_code', ''));
  used_referral text := upper(coalesce(new.raw_user_meta_data->>'referral_code_used', ''));
  public_official boolean := coalesce((new.raw_user_meta_data->>'is_public_official')::boolean, false);
  generated_referral text;
  founder boolean := false;
  standard_affiliate boolean := false;
begin
  founder := promo = 'FOUNDERS';
  standard_affiliate := promo = 'AFFILIATE';

  generated_referral := public.generate_referral_code(full_name, new.id);

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
    is_public_official
  )
  values (
    new.id,
    full_name,
    public.generate_profile_slug(base_slug, new.id),
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
    founder,
    generated_referral,
    nullif(used_referral, ''),
    founder or standard_affiliate,
    case
      when founder then 'founder'
      when standard_affiliate then 'standard'
      else null
    end,
    founder,
    founder,
    nullif(promo, ''),
    public_official
  )
  on conflict (user_id) do update
  set
    full_name = excluded.full_name,
    slug = excluded.slug,
    email = excluded.email,
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    is_affiliate = public.profiles.is_affiliate or excluded.is_affiliate,
    affiliate_tier = coalesce(public.profiles.affiliate_tier, excluded.affiliate_tier),
    billing_exempt = public.profiles.billing_exempt or excluded.billing_exempt,
    lifetime_free = public.profiles.lifetime_free or excluded.lifetime_free,
    promo_code_used = coalesce(public.profiles.promo_code_used, excluded.promo_code_used),
    is_public_official = public.profiles.is_public_official or excluded.is_public_official;

  return new;
exception
  when others then
    raise exception 'handle_new_user_profile failed: %', sqlerrm;
end;
$$;
