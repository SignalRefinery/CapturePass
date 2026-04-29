create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  slug text unique not null,
  full_name text not null,
  role_line text not null,
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
  primary_link_4_title text not null default 'Add to contacts',
  primary_link_4_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile record" on public.profiles;
create policy "Users can view their own profile record" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile record" on public.profiles;
create policy "Users can insert their own profile record" on public.profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile record" on public.profiles;
create policy "Users can update their own profile record" on public.profiles for update using (auth.uid() = user_id);

drop policy if exists "Profiles are publicly readable by slug" on public.profiles;
create policy "Profiles are publicly readable by slug" on public.profiles for select using (true);
