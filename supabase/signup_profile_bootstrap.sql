create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  slug text unique not null,
  full_name text not null default '',
  role_line text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  website_url text not null default '',
  primary_link_1_title text not null default 'Call',
  primary_link_1_url text not null default '',
  primary_link_2_title text not null default 'Email',
  primary_link_2_url text not null default '',
  primary_link_3_title text not null default 'Website',
  primary_link_3_url text not null default '',
  primary_link_4_title text not null default 'Website',
  primary_link_4_url text not null default '',
  is_active boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_plan_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

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
using (auth.uid() = user_id);

drop policy if exists "Profiles are publicly readable by slug" on public.profiles;
create policy "Profiles are publicly readable by slug"
on public.profiles for select
using (true);

create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.generate_profile_slug(base_slug text, user_uuid uuid)
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := public.slugify_text(base_slug);

  if candidate is null or candidate = '' then
    candidate := 'profile-' || left(user_uuid::text, 8);
  end if;

  if not exists(select 1 from public.profiles where slug = candidate) then
    return candidate;
  end if;

  return candidate || '-' || left(user_uuid::text, 8);
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_name text;
  last_name text;
  full_name text;
  suggested_slug text;
begin
  first_name := coalesce(new.raw_user_meta_data->>'first_name', '');
  last_name := coalesce(new.raw_user_meta_data->>'last_name', '');
  full_name := trim(both ' ' from concat(first_name, ' ', last_name));
  suggested_slug := coalesce(new.raw_user_meta_data->>'suggested_slug', full_name, new.email);

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
    is_active
  )
  values (
    new.id,
    full_name,
    public.generate_profile_slug(suggested_slug, new.id),
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
    false
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
