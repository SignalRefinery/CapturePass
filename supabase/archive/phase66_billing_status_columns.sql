alter table public.profiles
  add column if not exists subscription_status text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists card_notification_sent_at timestamptz;
