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
