alter table public.profiles
  add column if not exists is_active boolean not null default false,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_plan_key text;



