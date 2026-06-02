-- Business pricing, reusable seat tiers, setup fees, and Stripe lifecycle fields.
--
-- Seat/card capacity is stored on the organization. Cards included at setup
-- are based on purchased plan capacity, not the current employee count.

alter table public.organizations
  add column if not exists business_plan_key text,
  add column if not exists business_billing_interval text not null default 'monthly',
  add column if not exists seat_limit integer,
  add column if not exists included_card_count integer,
  add column if not exists is_managed boolean not null default false,
  add column if not exists setup_fee_paid_at timestamptz,
  add column if not exists card_allotment_total integer,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

update public.organizations
set
  is_managed = coalesce(managed_service_enabled, is_managed, false),
  business_plan_key = coalesce(
    business_plan_key,
    case
      when coalesce(managed_service_enabled, is_managed, false)
        then 'business_starter_managed'
      else 'business_starter_self'
    end
  ),
  business_billing_interval = coalesce(nullif(business_billing_interval, ''), 'monthly'),
  seat_limit = coalesce(seat_limit, 10),
  included_card_count = coalesce(included_card_count, 10),
  card_allotment_total = coalesce(card_allotment_total, included_card_count, 10)
where business_plan_key is null
  and (
    managed_service_enabled is not null
    or seat_limit is null
    or included_card_count is null
    or card_allotment_total is null
  );

alter table public.organizations
  drop constraint if exists organizations_business_plan_key_check;

alter table public.organizations
  add constraint organizations_business_plan_key_check
  check (
    business_plan_key is null
    or business_plan_key in (
      'business_starter_self',
      'business_starter_managed',
      'business_growth_self',
      'business_growth_managed',
      'business_pro_self',
      'business_pro_managed'
    )
  );

alter table public.organizations
  drop constraint if exists organizations_business_billing_interval_check;

alter table public.organizations
  add constraint organizations_business_billing_interval_check
  check (business_billing_interval in ('monthly', 'annual'));

alter table public.organizations
  drop constraint if exists organizations_business_capacity_check;

alter table public.organizations
  add constraint organizations_business_capacity_check
  check (
    (seat_limit is null or seat_limit > 0)
    and (included_card_count is null or included_card_count >= 0)
    and (card_allotment_total is null or card_allotment_total >= 0)
  );

create index if not exists organizations_business_plan_key_idx
on public.organizations (business_plan_key);

create index if not exists organizations_stripe_customer_id_idx
on public.organizations (stripe_customer_id);

create index if not exists organizations_stripe_subscription_id_idx
on public.organizations (stripe_subscription_id);

comment on column public.organizations.business_plan_key
is 'Exact TapTagg business plan key used for pricing, capacity, and managed-service behavior.';

comment on column public.organizations.business_billing_interval
is 'Business subscription billing interval: monthly or annual.';

comment on column public.organizations.seat_limit
is 'Reusable employee seat capacity purchased by the organization.';

comment on column public.organizations.included_card_count
is 'NFC cards included at setup based on purchased plan capacity.';

comment on column public.organizations.card_allotment_total
is 'Total setup card allotment purchased/included for the organization.';

comment on column public.organizations.is_managed
is 'Whether the organization is on a fully managed TapTagg business plan.';

comment on column public.organizations.setup_fee_paid_at
is 'Timestamp when the one-time business setup fee was paid.';
