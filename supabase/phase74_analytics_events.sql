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
