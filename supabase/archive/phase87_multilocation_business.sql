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
