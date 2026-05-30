create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  brand_color text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_theme text not null default 'full_color',
  brand_logo_url text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  managed_service_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organizations_brand_theme_check check (brand_theme in ('deep_brand', 'clean_light', 'full_color', 'custom'))
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null default '',
  email text,
  phone text,
  title text,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_members_role_check check (role in ('owner', 'admin', 'member')),
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

create index if not exists pass_tokens_organization_id_idx
on public.pass_tokens (organization_id);

create index if not exists pass_tokens_assigned_member_id_idx
on public.pass_tokens (assigned_member_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_pass_tokens_updated_at_trigger on public.pass_tokens;
create trigger touch_pass_tokens_updated_at_trigger
before update on public.pass_tokens
for each row execute function public.touch_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pass_tokens enable row level security;

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
