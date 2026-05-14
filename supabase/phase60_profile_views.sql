alter table public.profiles
  add column if not exists page_mode text not null default 'single',
  add column if not exists multi_view_display_mode text not null default 'favorite',
  add column if not exists default_view_id uuid;

do $$
begin
  alter table public.profiles
    add constraint profiles_page_mode_check check (page_mode in ('single', 'multi')),
    add constraint profiles_multi_view_display_mode_check check (multi_view_display_mode in ('landing', 'favorite'));
exception when duplicate_object then
  null;
end $$;

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Main View',
  view_key text not null,
  sort_order integer not null default 0,
  full_name text not null default '',
  role_line text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  website_url text not null default '',
  show_email boolean not null default true,
  show_phone boolean not null default true,
  show_text boolean not null default false,
  primary_link_1_title text not null default '',
  primary_link_1_url text not null default '',
  primary_link_2_title text not null default '',
  primary_link_2_url text not null default '',
  primary_link_3_title text not null default '',
  primary_link_3_url text not null default '',
  primary_link_4_title text not null default '',
  primary_link_4_url text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  alter table public.profile_views
    add constraint profile_views_profile_id_view_key_key unique (profile_id, view_key);
exception when duplicate_object then
  null;
end $$;

create index if not exists profile_views_profile_id_sort_order_idx on public.profile_views (profile_id, sort_order);

insert into public.profile_views (
  profile_id,
  view_key,
  name,
  sort_order,
  full_name,
  role_line,
  intro,
  email,
  phone,
  website_url,
  show_email,
  show_phone,
  show_text,
  primary_link_1_title,
  primary_link_1_url,
  primary_link_2_title,
  primary_link_2_url,
  primary_link_3_title,
  primary_link_3_url,
  primary_link_4_title,
  primary_link_4_url
)
select
  id,
  'main',
  'Main',
  0,
  full_name,
  role_line,
  intro,
  email,
  phone,
  website_url,
  true,
  true,
  false,
  primary_link_1_title,
  primary_link_1_url,
  primary_link_2_title,
  primary_link_2_url,
  primary_link_3_title,
  primary_link_3_url,
  primary_link_4_title,
  primary_link_4_url
from public.profiles p
where p.id is not null
  and not exists (
    select 1
    from public.profile_views v
    where v.profile_id = p.id
      and v.view_key = 'main'
  );

update public.profiles p
set default_view_id = v.id
from public.profile_views v
where v.profile_id = p.id
  and v.view_key = 'main';

alter table public.profile_views enable row level security;

drop policy if exists "Users can view their own profile views" on public.profile_views;
create policy "Users can view their own profile views" on public.profile_views for select using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert their own profile views" on public.profile_views;
create policy "Users can insert their own profile views" on public.profile_views for insert with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own profile views" on public.profile_views;
create policy "Users can update their own profile views" on public.profile_views for update using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own profile views" on public.profile_views;
create policy "Users can delete their own profile views" on public.profile_views for delete using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.user_id = auth.uid()
  )
);
