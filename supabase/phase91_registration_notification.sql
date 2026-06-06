-- Registration notification support.
--
-- Tracks when the internal registration email has already been sent so
-- promo-code and Stripe-based registrations only notify once.

alter table public.profiles
  add column if not exists registration_notification_sent_at timestamptz;

comment on column public.profiles.registration_notification_sent_at
is 'Timestamp for the internal registration notification email sent after signup or Stripe registration.';
