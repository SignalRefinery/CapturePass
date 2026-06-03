-- Business webhooks.
--
-- Stores outbound webhook settings and delivery attempts for TapTagg Business.

create table if not exists public.organization_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  enabled boolean not null default false,
  webhook_url text,
  webhook_secret text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  status_code integer,
  success boolean not null default false,
  attempted_at timestamptz not null default timezone('utc', now()),
  response_body text,
  error_message text
);

create index if not exists organization_webhooks_organization_id_idx
on public.organization_webhooks (organization_id);

create index if not exists webhook_deliveries_organization_id_attempted_at_idx
on public.webhook_deliveries (organization_id, attempted_at desc);

create index if not exists webhook_deliveries_attempted_at_idx
on public.webhook_deliveries (attempted_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_organization_webhooks_updated_at_trigger on public.organization_webhooks;
create trigger touch_organization_webhooks_updated_at_trigger
before update on public.organization_webhooks
for each row execute function public.touch_updated_at();

alter table public.organization_webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

drop policy if exists "Organization admins can view webhooks" on public.organization_webhooks;
create policy "Organization admins can view webhooks"
on public.organization_webhooks for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = organization_webhooks.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "Organization admins can view webhook deliveries" on public.webhook_deliveries;
create policy "Organization admins can view webhook deliveries"
on public.webhook_deliveries for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = webhook_deliveries.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
);

comment on table public.organization_webhooks
is 'Outbound webhook settings for TapTagg Business organizations.';

comment on table public.webhook_deliveries
is 'Outbound webhook delivery attempts emitted by TapTagg Business.';
